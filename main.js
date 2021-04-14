import * as Magick from "./node_modules/wasm-imagemagick/dist/magickAPI.js";

async function command(files, command){
    return await Magick.Call(files, command.split(" "))
}

const /*args = {},*/
      preparedImages = [],
      inputImages = [];

/*for(const [k, v] of new URLSearchParams(location.href)){
    args[k] = v
}*/

$(function(){
    if(window.isIE){
        alert("You are using Internet Explorer. This interface can only be used on modern browsers.")
        return
    }
    let U8File = function(source, name){
            this.content = new Uint8Array(source);
            this.name = name;
        },
        imagesToICO = async function(inputFiles){
            const cmd = "convert";
            for(let e of inputFiles){
                cmd += e.name
            }
            cmd += "icon.jpg";
            let processedFile = (await command(inputFiles, cmd))[0]
            $(".input-images").append(`<img src="${URL.createObjectURL(processedFile.blob)}">`)
            console.log("created image " + processedFile.name)
        };
    $("input").change(async function(){
        $(".loading").show()
        preparedImages.length = inputImages.length = 0;
        for(let e of this.files){
            let name = e.name.replaceAll(" ", "_");
            await new Promise((resolve, reject) => {
                let img = new Image();
                img.onload = async () => {
                    if(img.width != img.height || img.width > 256){
                        let buffer,
                            max = Math.max(img.width, img.height),
                            aspect = max >= 256 ? 256 : max;
                        await e.arrayBuffer().then(arrayBuffer => {
                            buffer = arrayBuffer
                        });
                        e = (await command([new U8File(buffer, name)], `convert -background none -gravity center ${name} -resize ${aspect}x${aspect} -extent ${aspect}x${aspect} ${name}.png`))[0];
                        img.src = URL.createObjectURL(e.blob)
                    }
                    inputImages.push(img)
                    resolve()
                };
                img.onerror = reject;
                img.src = URL.createObjectURL(e)
            })
            preparedImages.push(e)
        }
        for(let e of preparedImages){
            $(".input-images").append(`<img src="${URL.createObjectURL(e.blob ?? e)}" />`)
        }
        $(".loading").hide()
        //imagesToICO(inputFiles)
    })
})