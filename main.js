import * as Magick from "./wasm-imagemagick/magickApi.js"

async function command(files, command){
    return await Magick.Call(files, command.split(" "))
}

const /*args = {},*/
      preparedImages = [],
      preparedFiles = [];

/*for(const [k, v] of new URLSearchParams(location.search)){
    args[k] = v
}*/

function displayImages(){
    $(".input-images .imageContainer").remove();
    for(let i in preparedImages){
        $(".input-images").append(`<div class="image-container"><img src="${URL.createObjectURL(preparedImages[i])}" /><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" list-index=${i}><rect width="15" height="15" x=".5" y=".5" fill="red" stroke="maroon" stroke-linecap="round" ry="0"/><path fill="#fff" d="M6.63 2.585v.996H3.668v9.837h8.667V3.581H9.32v-.996z"/><path d="M5.833 1.5v1.083H1.5v1.084h1.083V14.5h10.834V3.667H14.5V2.583h-4.333V1.5zm1.084 1.083h2.166v1.084h3.25v9.75H3.667v-9.75h3.25zm-1.084 3.25v5.417h1.084V5.833zm3.25 0v5.417h1.084V5.833z" color="#4d4d4d"/></svg></div>`)
    }
}

$(function(){
    if(window.isIE){
        alert("You are using Internet Explorer. This application can only be used on modern browsers.")
        return
    }
    let U8File = function(source, name){
            this.content = new Uint8Array(source);
            this.name = name;
        },
        imagesToICO = async function(inputFiles){
            $(".output-images .loading").show()
            $(".output-images img:not(.loading)").remove()
            let cmd = "convert";
            for(let e of inputFiles){
                cmd += " "+e.name
            }
            cmd += " icon.ico";
            let processedFile = (await command(inputFiles, cmd))[0];
            $(".output-images").append(`<img src="${URL.createObjectURL(processedFile.blob)}" />`)
            $(".output-images .loading").hide()
        };
    $("input").change(async function(){
        /* Resetting */
        $(".input-images .loading").show()
        $(".input-images .image-container").remove()
        preparedImages.length = 0;

        /* Store uploaded images locally as blobs and Unit8Arrays */
        for(let e of this.files){
            let name = e.name.replaceAll(" ", "_");
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
        $(".input-images .loading").hide()
        
        $(".convert.button").removeClass("gray")
        if(!$("button")[0].onclick){
            $("button")[0].onclick = function(){
                imagesToICO(preparedFiles)
            }
        }
        $(".image-container svg").click(function(){
            let i = $(this).attr("list-index");
            preparedImages.splice(i, 1)
            preparedFiles.splice(i, 1)
            displayImages()
        })
    })
})