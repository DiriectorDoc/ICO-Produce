import * as Magick from "./node_modules/wasm-imagemagick/dist/magickAPI.js";

async function command(files, command){
    return await Magick.Call(files, command.split(" "))
}

$(function(){
    if(window.isIE){
        alert("You are using Internet Explorer. Come aspects of this page will not load correctly.")
    }
    let File = function(source, name){
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
            $(".preview-images").append(`<img src="${URL.createObjectURL(processedFile.blob)}">`)
            console.log("created image " + processedFile.name)
        };
    $("input").change(async function(){
        $(".loading").show()
        let preparedImages = [],
            inputImages;
        for(let e of this.files){
            let name = e.name.replaceAll(" ", "_");
            await new Promise((resolve, reject) => {
                let img = new Image();
                img.onload = async () => {
                    if(img.width != img.height || img.width > 256){
                        let buffer;
                        await e.arrayBuffer().then(arrayBuffer => {
                            buffer = arrayBuffer
                        });
                        e = (await command([new File(buffer, name)], `convert -background none -gravity center ${name} -resize 256x256 -extent 256x256 ${name}.png`))[0];
                        img.src = URL.createObjectURL(e)
                    }
                    inputImages.push(img)
                    resolve()
                };
                img.onerror = reject;
                img.src = URL.createObjectURL(e)
            })

            await e.arrayBuffer().then(buffer => {
                preparedImages.push(new File(buffer, e.name.replaceAll(" ", "_")))
            })
        }
        for(let e of inputImages){
            $(".loading").append(e)
        }
        //imagesToICO(inputFiles)
    })
})