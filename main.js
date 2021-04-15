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
        /* ReseTting */
        $(".input-images .loading").show()
        $(".input-images img:not(.loading)").remove()
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
                        let max = Math.max(img.width, img.height),
                            aspect = max >= 256 ? 256 : max;
                        e = (await command([new U8File(buffer, name)], `convert -background none -gravity center ${name} -resize ${aspect}x${aspect} -extent ${aspect}x${aspect} ${name}.png`))[0].blob;
                        await e.arrayBuffer().then(arrayBuffer => {
                            buffer = arrayBuffer
                        });
                    }
                    preparedFiles.push(new U8File(buffer, name))
                    resolve()
                };
                img.onerror = reject;
                img.src = URL.createObjectURL(e)
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
        for(let e of preparedImages){
            $(".input-images").append(`<img src="${URL.createObjectURL(e)}" />`)
        }
        $(".input-images .loading").hide()
        
        $(".convert.button").removeClass("gray")
        $("button").click(function(){
            imagesToICO(preparedFiles)
        })
    })
})