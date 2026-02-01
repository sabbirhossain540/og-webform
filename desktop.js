(function() {
    'use strict';

    // Load FontAwesome
    const fontAwesome = document.createElement('link');
    fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css";
    fontAwesome.rel = "stylesheet";
    document.head.appendChild(fontAwesome);



    kintone.events.on('app.record.index.show', async function(event) {
        console.log(event);

    });


})();