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
    overlayImg.className = 'overlay-mask';
    overlayImg.style.position = 'absolute';
    overlayImg.style.top = '0';
    overlayImg.style.left = '0';
    overlayImg.style.width = '100%';
    overlayImg.style.height = '100%';
    overlayImg.style.objectFit = 'contain';
    overlayImg.style.pointerEvents = 'none';
    document.querySelector('.camera-screen').appendChild(overlayImg);

    const taskLabels = document.querySelectorAll('.checkbox-label');
    let currentTaskIndex = 0;

    const tasks = [
    {
        label: '"Fange den perfekten, blauen Himmel ein." -> Platziere die Gruppe vor einem blauen Himmel.',
        img: 'gruppe-blau.png',
        check: (r,g,b)=> b>100 && b>r+40 && b>g+40,
        validate: (data,w,h)=> colorRatio(data,w,h,(r,g,b)=> b>100 && b>r+40 && b>g+40) > 0.6
    },
    {
        label: '"Der Chef will Farbe!" -> Finde ein Motiv mit intensiven, bunten Flächen.',
        img: 'gruppe-bunt.png',
        check: (r,g,b)=> true,
        validate: (data,w,h)=> colorVariance(data,w,h) > 2000
    },
    {
        label: '"Finde einen Hintergrund, der farblich gut zur Kleidung der Reisegruppe passt. Das erzeugt Harmonie im Reisekatalog."',
        img: 'gruppe-orange.png',
        check: (r,g,b)=> r>150 && r>g+40 && r>b+40,
        validate: (data,w,h)=> colorRatio(data,w,h,(r,g,b)=> r>150 && r>g+40 && r>b+40) > 0.5
    },
    {
        label: '"Die Redaktion sagt wir brauchen mehr “Nature Vibes”". -> Such einen Hintergrund mit möglichst viel Natur.',
        img: 'gruppe-gruen.png',
        check: (r,g,b)=> g>100 && g>r+30 && g>b+30,
        validate: (data,w,h)=> colorRatio(data,w,h,(r,g,b)=> g>100 && g>r+30 && g>b+30) > 0.5
    },
    {
        label: '"Fang die Gruppe beim Sterne beobachten ein. Achte auf einen schönen Sternenhimmel."',
        img: 'gruppe-gruen.png',
        check: (r,g,b)=> true,
        validate: (data,w,h)=> averageBrightness(data,w,h) < 40
    }
    ];

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
        'Die Redaktion wartet auf erste Previews. Nächstes bitte etwas brauchbares.',
        'Heute Abend ist die Deadline, bis dahin muss das noch besser werden!',
        'Wenn das so weiter geht können Sie sich nach einem anderen Arbeitsplatz umschauen...'
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
      function takePhoto(){
        if(!video.videoWidth || !video.videoHeight) return;
        const canvas = document.createElement('canvas');
        // capture with natural orientation: use video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // PNG overlay
        if(overlayImg.src){
            const img = new Image();
            img.src = overlayImg.src;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        photos.unshift(dataUrl); // newest first
        updatePreview();
        updateGrid();
        triggerMessage();
      }

      function updatePreview(){
        if(photos.length===0){
          preview.style.backgroundImage = '';
          preview.style.display = 'none';
        }else{
          preview.style.backgroundImage = `url(${photos[0]})`;
          preview.style.display = 'block';
        }
      }

      function updateGrid(){
        grid.innerHTML = '';
        photos.forEach((d,i)=>{
          const img = document.createElement('img');
          img.src = d;
          img.alt = `Foto ${i+1}`;
          img.addEventListener('click', ()=>openViewer(i));
          grid.appendChild(img);
        });
      }

      function openGallery(){
        galleryOverlay.style.display = 'flex';
      }
      function closeGallery(){
        galleryOverlay.style.display = 'none';
      }

      function openViewer(index){
        viewerImg.src = photos[index];
        viewer.style.display = 'flex';
      }
      function closeViewer(){
        viewer.style.display = 'none';
      }

      function openList(){
        listOverlay.style.display = 'flex';
      }

      function closeList(){
        listOverlay.style.display = 'none';
      }

    function analyzeTask(canvas){
        if(currentTaskIndex >= tasks.length) return;
        const ctx = canvas.getContext('2d');
        const {data,width,height} = ctx.getImageData(0,0,canvas.width,canvas.height);


        const task = tasks[currentTaskIndex];
        const passed = task.validate(data,width,height);

        if(passed){
            taskLabels[currentTaskIndex].querySelector('input').checked = true;
            currentTaskIndex++;
            updateOverlay();
            showRandomMessage('positive');
        }else{
            showRandomMessage('negative');
        }
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

    function updateOverlay(){
        if(tasks[currentTaskIndex]){
            overlayImg.src = tasks[currentTaskIndex].img;
        }else{
            overlayImg.src = '';
        }
    }

    // Show notif
    function showRandomMessage(type){
        const list = type==='positive'?positiveMsgs:negativeMsgs;
        const pick = list[Math.floor(Math.random()*list.length)];
        setTimeout(()=>{
            notifFrom.textContent = 'Chef Reisebüro';
            notifText.textContent = pick;
            showNotif();
        },4000);
    }

    function showNotif(){
        notif.style.display='flex';
        notif.animate([
            { transform: 'translateX(-50%) translateY(-120%)' },
            { transform: 'translateX(-50%) translateY(20px)' }
        ],{duration:450,fill:'forwards',easing:'cubic-bezier(.2,.9,.2,1)'});
        setTimeout(()=>hideNotif(),2450);
    }

    function hideNotif(){
        notif.animate([
            { transform: 'translateX(-50%) translateY(20px)' },
            { transform: 'translateX(-50%) translateY(-120%)' }
        ],{duration:420,fill:'forwards',easing:'cubic-bezier(.2,.9,.2,1)'}).onfinish=()=>notif.style.display='none';
    }


      // events
      shutter.addEventListener('click', takePhoto);
      preview.addEventListener('click', ()=> openGallery());
      openGalleryBtn.addEventListener('click', openGallery);
      closeGalleryBtn.addEventListener('click', closeGallery);
      viewerClose.addEventListener('click', closeViewer);
      viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer()});
      openListBtn.addEventListener('click', openList);
      closeListBtn.addEventListener('click', closeList);
      startCameraBtn.addEventListener('click',()=>startCamera());
      viewer.addEventListener('click', (e)=>{ if(e.target===viewer) closeViewer(); });

      // start on load
      // startCamera();

      updatePreview();
      

    })();
