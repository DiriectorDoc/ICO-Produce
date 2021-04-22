import * as Magick from "./wasm-imagemagick/magickApi.js"

async function command(files, command){
    return await Magick.Call(files, command.split(" "))
}

const args = (a=>(new URLSearchParams(window.location.search).forEach((e,o)=>a[o]=e),a))({}),
      preparedImages = [],
      preparedFiles = [];

function dataURItoBlob(dataURI) {
    let b = atob(dataURI.split(',')[1]),
        a = new ArrayBuffer(b.length),
        u = new Uint8Array(a);
    for (var i = 0; i < b.length; i++) {
        u[i] = b.charCodeAt(i);
    }
    return new Blob([u], {type: dataURI.split(',')[0].split(':')[1].split(';')[0]});
}

function displayImages(){
    $(".input-preview .imageContainer").remove();
    for(let i in preparedImages){
        $(".input-preview")
            .append(`<div class="image-container"><img src="${URL.createObjectURL(preparedImages[i])}" /><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" list-index=${i}><rect width="15" height="15" x=".5" y=".5" fill="red" stroke="maroon" stroke-linecap="round" ry="0"/><path fill="#fff" d="M6.63 2.585v.996H3.668v9.837h8.667V3.581H9.32v-.996z"/><path d="M5.833 1.5v1.083H1.5v1.084h1.083V14.5h10.834V3.667H14.5V2.583h-4.333V1.5zm1.084 1.083h2.166v1.084h3.25v9.75H3.667v-9.75h3.25zm-1.084 3.25v5.417h1.084V5.833zm3.25 0v5.417h1.084V5.833z" color="#4d4d4d"/></svg></div>`)
    }
    $(".image-container svg").click(function(){
        let i = $(this).attr("list-index");
        preparedImages.splice(i, 1)
        preparedFiles.splice(i, 1)
        displayImages()
    })
}
async function imagesToICO(inputFiles){
    $(".output .loading").show()
    $(".output img:not(.loading)").remove()
    let cmd = "convert";
    for(let e of inputFiles){
        cmd += " "+e.name
    }
    cmd += " icon.ico";
    let processedFile = (await command(inputFiles, cmd))[0];
    $(".output").append(`<img src="${URL.createObjectURL(processedFile.blob)}" />`)
    $(".output .loading").hide()
}

async function pixelateSVG(svg){
    let result;
    $(".dialogue-container").show()
    $("input[value=256]").click()
    await new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => {
            $(".preview-svg").html(img)
            $(".svg-dialogue .options button.accept")[0].onclick = function(){
                let canvas = $("<canvas>")[0],
                    devisor = Math.max(img.naturalWidth, img.naturalHeight) / $(".svg-dialogue .options input:checked").val();
                canvas.width = Math.round(img.naturalWidth / devisor);
                canvas.height = Math.round(img.naturalHeight / devisor);
                let c = canvas.getContext("2d");
                c.drawImage(img, 0, 0, canvas.width, canvas.height)
                resolve(dataURItoBlob(canvas.toDataURL("image/png")))
            };
            $(".svg-dialogue .options button.cancel")[0].onclick = function(){
                if(window.confirm("Skip upload of this SVG?")){
                    reject()
                }
            }
        };
        img.src = URL.createObjectURL(svg);
    }).then(e => {
        result = e
    }).catch(err => {
        result = false
    })
    $(".dialogue-container").hide()
    return result
}

class U8File {
    constructor(source, name) {
        this.content = new Uint8Array(source);
        this.name = name;
    }
}

$(function(){
    if(window.isIE){
        alert("You are using Internet Explorer. This application can only be used on modern browsers.")
        return
    }
    $(".input input").change(async function(){
        /* Resetting */
        $(".input-preview .loading").show()
        $(".input-preview .image-container").remove()
        preparedImages.length = 0;

        /* Store uploaded images locally as blobs and Unit8Arrays */
        for(let e of this.files){
            let name = e.name.replaceAll(" ", "_");
            switch(/\.\w+$/i.exec(name)+""){
                case ".svg":
                    if(e = await pixelateSVG(e)){
                        name += ".png"
                        break
                    } else {
                        continue
                    }
            }
            await new Promise((resolve, reject) => {
                let img = new Image();
                img.onload = async () => {
                    let buffer;
                    await e.arrayBuffer().then(arrayBuffer => {
                        buffer = arrayBuffer
                    });
                    if(img.width != img.height || img.width > 256){
                        let aspect = Math.min(Math.max(img.width, img.height), 256);
                        e = (await command([new U8File(buffer, name)], `convert -background none -gravity center ${name} -extent ${aspect}x${aspect} ${name}_e.png`))[0].blob;
                        await e.arrayBuffer().then(arrayBuffer => {
                            buffer = arrayBuffer
                        });
                    }
                    preparedFiles.push(new U8File(buffer, name))
                    resolve()
                };
                img.onerror = reject;
                e.arrayBuffer().then(async (buffer) => {
                    img.src = URL.createObjectURL(e = (await command([new U8File(buffer, name)], `convert ${name} -resize 256x256> ${name}_s.png`))[0].blob)
                })
            })
            preparedImages.push(e)
        }

        /* Bubble sort; smallest to largest in size; may be important for conversion */
        for(let i = 1; i < preparedImages.length; i++)
            for(let j = 0; j < preparedImages.length - i; j++){
                if(preparedImages[j+1].width < preparedImages[j].width){
                    [preparedImages[j+1], preparedImages[j], preparedFiles[j+1], preparedFiles[j]] =
                    // Swap ↑                   ↑                  ↑                   ↑
                    [preparedImages[j], preparedImages[j+1], preparedFiles[j], preparedFiles[j+1]]
                }
            }

        /* Display the uploaded images */
        displayImages()
        $(".input-preview .loading").hide()
        
        $(".convert.button").removeClass("gray")
        $("button")
            .off("click")
            .click(function(){
                imagesToICO(preparedFiles)
            })
    })
    $(".svg-dialogue .options input").click(function(){
        $(".preview-svg").attr("class", "preview-svg s"+this.value)
    })
})