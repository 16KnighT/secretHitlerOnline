


function init() {
    console.log("hi")

    document.getElementById('hostButt').addEventListener('click',() => {
        // hide all pages
        // show the page we want
        for ( const el of document.getElementsByClassName("mainpage")) {
            el.style.display = 'none'
        }

        document.getElementById('gamemenu').style.display = ''

    })
}