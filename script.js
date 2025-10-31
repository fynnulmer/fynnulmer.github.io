(function(){
    const video = document.getElementById('video');
    const shutter = document.getElementById('shutterBtn');
    const preview = document.getElementById('galleryPreview');
    const openGalleryBtn = document.getElementById('openGalleryBtn');
    const galleryOverlay = document.getElementById('galleryOverlay');
    const closeGalleryBtn = document.getElementById('closeGalleryBtn');
    const openListBtn = document.getElementById('openListBtn');
    const listOverlay = document.getElementById('listOverlay');
    const closeListBtn = document.getElementById('closeListBtn');
    const grid = document.getElementById('grid');
    const viewer = document.getElementById('viewer');
    const viewerImg = document.getElementById('viewerImg');
    const viewerClose = document.getElementById('viewerClose');
    const notif = document.getElementById('notif');
    const notifFrom = document.getElementById('notifFrom');
    const notifText = document.getElementById('notifText');
    const startOverlay=document.getElementById('startOverlay');
    const startCameraBtn=document.getElementById('startCameraBtn');
    const overlayImg = document.createElement('img');
    const downloadViewerBtn = document.getElementById('downloadViewerBtn');
 overlayImg.className = 'overlay-img';
    document.querySelector('.camera-screen').appendChild(overlayImg);

    let taskLabels = [];
    let currentTaskIndex = 0;
    let completedPhotoIndexes = []; // Stores indexes of photos that completed a task

    // set screen height dynamically
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    window.addEventListener('resize', () => {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    });

    // Utility: RGB to HSL
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
                case g: h = ((b - r) / d + 2); break;
                case b: h = ((r - g) / d + 4); break;
            }
            h *= 60;
        }
        return [h, s * 100, l * 100];
    }

    // 1. Blue
    function isBlue(r, g, b) {
        const [h, s, l] = rgbToHsl(r, g, b);
        return h > 180 && h < 260 && s > 20 && l > 10 && l < 90;
    }

    // 2. Bunt
    function hueVariance(data, w, h) {
        const hues = [];
        for (let i = 0; i < data.length; i += 4) {
            const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
            hues.push(h);
        }
        const mean = hues.reduce((a, b) => a + b, 0) / hues.length;
        const variance = hues.reduce((sum, h) => {
            let diff = Math.abs(h - mean);
            if (diff > 180) diff = 360 - diff;
            return sum + diff * diff;
        }, 0) / hues.length;
        return variance;
    }
    function isColorful(r, g, b) {
        const [h, s, l] = rgbToHsl(r, g, b);
        return s > 45 && l > 15 && l < 85; // "colorful" pixel
    }

    // 3. Orange
    function isOrange(r, g, b) {
        const [h, s, l] = rgbToHsl(r, g, b);
        // Orange = hue ~20-45, saturation >50, lightness 20-70
        return h > 0 && h < 60 && s > 30 && l > 30 && l < 80;
    }

    // 4. Grün
    function isGreen(r, g, b) {
        const [h, s, l] = rgbToHsl(r, g, b);
        // Green ~90-160, saturation >40, lightness 15-80
        return h > 60 && h < 170 && s > 20 && l > 10 && l < 90;
    }

    // 5. Dunkel
    function averageLightness(data, w, h) {
        let sum = 0;
        const total = w * h;
        for (let i = 0; i < data.length; i += 4) {
            const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
            sum += l;
        }
        return sum / total;
    }

    // colorRatio for HSL-based checks
    function colorRatio(data, w, h, checkFn) {
        let ok = 0, total = w * h;
        for (let i = 0; i < data.length; i += 4) {
            if (checkFn(data[i], data[i + 1], data[i + 2])) ok++;
        }
        return ok / total;
    }

    const tasks = [
        {
            label: '"Fange den perfekten, blauen Himmel ein." → Platziere die Gruppe vor einem blauen Himmel.',
            img: 'img/gruppe-blau.png',
            imgClass: 'gruppe-blau',
            check: isBlue,
            validate: (data, w, h) => colorRatio(data, w, h, isBlue) > 0.25
        },
        {
            label: '"Der Chef will Farbe!" → Finde ein Motiv mit intensiven, bunten Flächen.',
            img: 'img/gruppe-bunt.png',
            imgClass: 'gruppe-bunt',
            check: isColorful,
            validate: (data, w, h) => hueVariance(data, w, h) > 7000
        },
        {
            label: '"Finde einen Hintergrund, der farblich gut zur Kleidung der Reisegruppe passt. Das erzeugt Harmonie im Reisekatalog."',
            img: 'img/gruppe-orange.png',
            imgClass: 'gruppe-orange',
            check: isOrange,
            validate: (data, w, h) => colorRatio(data, w, h, isOrange) > 0.2
        },
        {
            label: '"Die Redaktion sagt wir brauchen mehr “Nature Vibes”". → Such einen Hintergrund mit möglichst viel Natur.',
            img: 'img/gruppe-gruen.png',
            imgClass: 'gruppe-gruen',
            check: isGreen,
            validate: (data, w, h) => colorRatio(data, w, h, isGreen) > 0.2
        },
        {
            label: '"Fang die Gruppe beim Sterne beobachten ein. Achte auf einen schönen Sternenhimmel."',
            img: 'img/gruppe-dunkel.png',
            imgClass: 'gruppe-dunkel',
            check: (r, g, b) => true,
            validate: (data, w, h) => averageLightness(data, w, h) < 30 // much darker using HSL lightness
        }
    ];

    function populateTaskList(){
        const listBody = document.querySelector('.list-body ul');
        listBody.innerHTML = ''; // alten Inhalt entfernen

        tasks.forEach((task, index) => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';

            label.appendChild(document.createTextNode(task.label));

            listBody.appendChild(label);
        });
    }

    // Aufruf beim Start
    populateTaskList();
    taskLabels = document.querySelectorAll('.checkbox-label');

    const positiveMsgs = [
        'Das sieht doch gar nicht so schlecht aus!',
        'Das ist perfekt getroffen, weiter so!',
        'Sie begeistern mich jedes Mal aufs neue!',
        'Das Licht ist hier ja perfekt, sehr gut!',
        'Sie haben ein wirklich gutes Auge für Details!'
    ];

    const negativeMsgs = [
        'Bitte weniger Experimente und mehr funktionierende Fotos!!',
        'Ich dachte ich hätte einen professionellen Fotografen angestellt, was soll das?',
        'Die Redaktion wartet auf erste Previews. Nächstes Mal bitte etwas brauchbares.',
        'Heute Abend ist die Deadline, bis dahin muss das noch besser werden!',
        'Wenn das so weiter geht können Sie sich nach einem anderen Arbeitsplatz umschauen...',
        'Wir bezahlen Sie nicht fürs Ausprobieren, sondern fürs Abliefern.',
        'So nicht. Haben Sie überhaupt ausprobiert, was funktioniert?',
        'Das ist nicht schlecht, aber leider auch nicht gut.',
        'So kann das nicht weitergehen – bitte konzentrieren Sie sich!',
        'Sind das wirklich die besten Bilder, die Sie haben?'
    ];

    let photos = []; // data URLs

    // start rear facing camera
    async function startCamera(){
        try{
            const constraints={video:{facingMode:{ideal:'environment'}},audio:false};
            const stream=await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject=stream;
            startOverlay.style.display='none';
        }catch(err){
            console.warn('Fehler beim Zugriff auf Kamera',err);
            alert('Kamera konnte nicht gestartet werden. Bitte Zugriff erlauben.');
        }
    }

    // take photo
    function takePhoto() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 1️⃣ Kamerabild zeichnen
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2️⃣ Overlay mit denselben Maßen wie im Live-Stream zeichnen
    const overlayRect = overlayImg.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();

    // Verhältnis vom Overlay relativ zur Videoanzeige berechnen
    const relX = (overlayRect.left - videoRect.left) / videoRect.width;
    const relY = (overlayRect.top - videoRect.top) / videoRect.height;
    const relW = overlayRect.width / videoRect.width;
    const relH = overlayRect.height / videoRect.height;

    const drawX = relX * canvas.width;
    const drawY = relY * canvas.height;
    const drawW = relW * canvas.width;
    const drawH = relH * canvas.height;

    // --- Aspect ratio fix ---
    const overlayAspect = overlayImg.naturalWidth / overlayImg.naturalHeight;
    const videoAspect = video.videoWidth / video.videoHeight;

    let finalW, finalH;
    if (videoAspect > overlayAspect) {
        // Video is wider, constrain by height
        finalH = drawH;
        finalW = finalH * overlayAspect;
    } else {
        // Video is taller, constrain by width
        finalW = drawW;
        finalH = finalW / overlayAspect;
    }

    // Center overlay in its calculated box
    const finalX = drawX + (drawW - finalW) / 2;
    const finalY = drawY + (drawH - finalH) / 2;

    ctx.drawImage(overlayImg, finalX, finalY, finalW, finalH);

    // 3️⃣ Task-Analyse durchführen und ggf. Notification anzeigen
    const success = analyzeTask(canvas);

    // 4️⃣ Foto speichern
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    photos.push(img.src);
    if(success) {
        completedPhotoIndexes.push(photos.length - 1);
    }
    updatePreview();
    updateGrid();
}

    function updatePreview(){
        if(photos.length===0){
            preview.style.backgroundImage = '';
            preview.style.display = 'none';
        }else{
            preview.style.backgroundImage = `url(${photos[photos.length - 1]})`;
            preview.style.display = 'block';
        }
    }

    function updateGrid(){
        grid.innerHTML = '';
        photos.forEach((d,i)=>{
            const img = document.createElement('img');
            img.src = d;
            img.alt = `Foto ${i+1}`;
            img.className = completedPhotoIndexes.includes(i) ? 'photo-success' : '';
            img.addEventListener('click', ()=>openViewer(i));

            const wrapper = document.createElement('div');
            wrapper.className = 'photo-wrapper';
            wrapper.appendChild(img);

            grid.appendChild(wrapper);
        });
    }

    function openGallery(){
        galleryOverlay.style.display = 'flex';
    }
    function closeGallery(){
        galleryOverlay.style.display = 'none';
    }

    let currentViewerIndex = null;

    function openViewer(index){
        viewerImg.src = photos[index];
        viewer.style.display = 'flex';
        currentViewerIndex = index;
    }
    function closeViewer(){
        viewer.style.display = 'none';
        currentViewerIndex = null;
    }

    function openList(){
        listOverlay.style.display = 'flex';
    }

    function closeList(){
        listOverlay.style.display = 'none';
    }

    downloadViewerBtn.addEventListener('click', function(e) {
        if (currentViewerIndex !== null) {
            const url = photos[currentViewerIndex];
            const a = document.createElement('a');
            a.href = url;
            a.download = `photo_${currentViewerIndex + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    });

    function analyzeTask(canvas){
        if(currentTaskIndex >= tasks.length) return false;
        const ctx = canvas.getContext('2d');
        const {data,width,height} = ctx.getImageData(0,0,canvas.width,canvas.height);

        const task = tasks[currentTaskIndex];
        const passed = task.validate(data,width,height);

        if(passed){
            taskLabels[currentTaskIndex].classList.add('done');
            currentTaskIndex++;
            updateOverlay();
            showRandomMessage('positive');
        }else{
            showRandomMessage('negative');
        }
        return passed;
    }

    function showRandomMessage(type){
        const list = type==='positive'?positiveMsgs:negativeMsgs;
        const pick = list[Math.floor(Math.random()*list.length)];
        setTimeout(()=>{
            notifFrom.textContent = 'Chef Reisebüro';
            notifText.textContent = pick;

            notif.style.border = type === 'positive' ? '2px solid #38c172' : '2px solid #D5576A';
            showNotif();
        },2000);
    }

    // Check colors
    function colorRatio(data,w,h,checkFn){
        let ok=0;const total=w*h;
        for(let i=0;i<data.length;i+=4){
            if(checkFn(data[i],data[i+1],data[i+2])) ok++;
        }
        return ok/total;
    }

    function colorVariance(data,w,h){
        let mean=[0,0,0];let total=w*h;
        for(let i=0;i<data.length;i+=4){
            mean[0]+=data[i];mean[1]+=data[i+1];mean[2]+=data[i+2];
        }
        mean=mean.map(v=>v/total);
        let variance=0;
        for(let i=0;i<data.length;i+=4){
            const r=data[i]-mean[0];const g=data[i+1]-mean[1];const b=data[i+2]-mean[2];
            variance+=(r*r+g*g+b*b)/3;
        }
        return variance/total;
    }

    function averageBrightness(data,w,h){
        let sum=0;const total=w*h;
        for(let i=0;i<data.length;i+=4){
            sum+=(0.299*data[i]+0.587*data[i+1]+0.114*data[i+2]);
        }
        return sum/total;
    }

    function updateOverlay() {
        setTimeout(() => {
            overlayImg.className = 'overlay-img';
            if (tasks[currentTaskIndex]) {
                overlayImg.src = tasks[currentTaskIndex].img;
                if (tasks[currentTaskIndex].imgClass) {
                    overlayImg.classList.add(tasks[currentTaskIndex].imgClass);
                }
            } else {
                overlayImg.src = '';
                showCompletionPopup();
            }
        }, 2000);
    }

    function showCompletionPopup() {
        document.getElementById('completionPopup').style.display = 'flex';
    }

    document.getElementById('restartBtn').addEventListener('click', restartTasks);

    function restartTasks() {
        // Hide popup
        document.getElementById('completionPopup').style.display = 'none';
        // Reset task progress
        currentTaskIndex = 0;
        taskLabels.forEach(label => label.classList.remove('done'));
        updateOverlay(); // Show first task overlay again
    }

    function showNotif(){
        console.log("showNotif called");
        notif.style.display='flex';
        console.log("notif display style:", notif.style.display); // logs 'flex'
        notif.animate([
            { transform: 'translateX(-50%) translateY(-120px)' },
            { transform: 'translateX(-50%) translateY(18px)' }
        ],{duration:450,fill:'forwards',easing:'cubic-bezier(.2,.9,.2,1)'});
        setTimeout(()=>hideNotif(),4500);
    }

    function hideNotif(){
        notif.animate([
            { transform: 'translateX(-50%) translateY(20px)' },
            { transform: 'translateX(-50%) translateY(-120%)' }
        ],{duration:420,fill:'forwards',easing:'cubic-bezier(.2,.9,.2,1)'}).onfinish=()=>notif.style.display='none';
    }

    // events
    shutter.addEventListener('click', takePhoto);
    preview.addEventListener('click', () => openGallery());
    openGalleryBtn.addEventListener('click', openGallery);
    closeGalleryBtn.addEventListener('click', closeGallery);
    viewerClose.addEventListener('click', closeViewer);
    viewer.addEventListener('click',e => {
        if(e.target===viewer)
            closeViewer()
    });
    openListBtn.addEventListener('click', openList);
    closeListBtn.addEventListener('click', closeList);
    startCameraBtn.addEventListener('click',() => {
        startCamera();
        updateOverlay();
    });
    viewer.addEventListener('click', (e) => { 
        if(e.target===viewer) 
            closeViewer(); 
    });

    // start on load
    // startCamera();

})();
