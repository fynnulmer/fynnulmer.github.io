(function(){
      const video = document.getElementById('video');
      const shutter = document.getElementById('shutterBtn');
      const preview = document.getElementById('previewBubble');
      const openGalleryBtn = document.getElementById('openGalleryBtn');
      const galleryOverlay = document.getElementById('galleryOverlay');
      const closeGalleryBtn = document.getElementById('closeGalleryBtn');
      const grid = document.getElementById('grid');
      const viewer = document.getElementById('viewer');
      const viewerImg = document.getElementById('viewerImg');
      const viewerClose = document.getElementById('viewerClose');
      const notif = document.getElementById('notif');
      const notifFrom = document.getElementById('notifFrom');
      const notifText = document.getElementById('notifText');
      const startOverlay=document.getElementById('startOverlay');
const startCameraBtn=document.getElementById('startCameraBtn');

      let photos = []; // data URLs

      const messages = [
        {from:'Chef', text:'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'},
        {from:'Chef', text:'Vestibulum ante ipsum primis in faucibus orci luctus.'},
        {from:'Chef', text:'Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.'},
        {from:'Chef', text:'Praesent sapien massa, convallis a pellentesque nec.'},
        {from:'Chef', text:'Sed porttitor lectus nibh. Mauris blandit aliquet elit.'},
        {from:'Chef', text:'Integer nec odio. Praesent libero. Sed cursus ante dapibus.'},
        {from:'Chef', text:'Fusce nec tellus sed augue semper porta.'},
        {from:'Chef', text:'Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus.'},
        {from:'Chef', text:'Donec rutrum congue leo eget malesuada.'},
        {from:'Chef', text:'Nulla quis lorem ut libero malesuada feugiat.'}
      ];

      // try to start camera with rear facing
    async function startCamera(){
    try{
    const constraints={video:{facingMode:{ideal:'environment'}},audio:false};
    const stream=await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject=stream;
    startOverlay.style.display='none';
    }catch(err){
    console.warn('Fehler beim Zugriff auf Kamera',err);
    alert('Kamera konnte nicht gestartet werden. Bitte Zugriff erlauben oder HTTPS verwenden.');
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

      // message animation: after 4s show notif, 2s visible, then hide
      function triggerMessage(){
        // pick random
        const pick = messages[Math.floor(Math.random()*messages.length)];
        setTimeout(()=>{
          notifFrom.textContent = pick.from;
          notifText.textContent = pick.text;
          showNotif();
        }, 4000);
      }

      function showNotif(){
        notif.style.display = 'flex';
        notif.setAttribute('aria-hidden','false');
        // animate from top: use transform on top value
        notif.animate([
          { transform: 'translateX(-50%) translateY(-120%)', top: '-120px' },
          { transform: 'translateX(-50%) translateY(20px)', top: '20px' }
        ],{duration:450,fill:'forwards',easing:'cubic-bezier(.2,.9,.2,1)'});
        // remain 2s then hide
        setTimeout(()=>hideNotif(), 2450);
      }
      function hideNotif(){
        const anim = notif.animate([
          { transform: 'translateX(-50%) translateY(20px)', top: '20px' },
          { transform: 'translateX(-50%) translateY(-120%)', top: '-120px' }
        ],{duration:420,fill:'forwards',easing:'cubic-bezier(.2,.9,.2,1)'});
        anim.onfinish = ()=>{
          notif.style.display = 'none';
          notif.setAttribute('aria-hidden','true');
        };
      }

      // events
      shutter.addEventListener('click', takePhoto);
      preview.addEventListener('click', ()=> openGallery());
      openGalleryBtn.addEventListener('click', openGallery);
      closeGalleryBtn.addEventListener('click', closeGallery);
      viewerClose.addEventListener('click', closeViewer);
      viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer()});
      startCameraBtn.addEventListener('click',()=>startCamera());

      // also allow tapping viewer image to close
      viewer.addEventListener('click', (e)=>{ if(e.target===viewer) closeViewer(); });

      // keyboard shortcuts for desktop testing
      document.addEventListener('keydown', (e)=>{
        if(e.key==='g') openGallery();
        if(e.key==='c') closeGallery();
        if(e.key==='Escape'){
          if(viewer.style.display==='flex') closeViewer();
          else if(galleryOverlay.style.display==='flex') closeGallery();
        }
      });

      // start on load
      // startCamera();
      updatePreview();

      // hint: handle visibility when switching between camera and gallery
      // show close-to-camera X -> when in gallery, show different close button
      // already handled by UI buttons

      // try to request camera right away on gestureless start (modern browsers allow autoplay if muted + playsinline)
      // nothing else required

      // ensure orientation changes adjust positions (CSS covers most). But ensure shutter transforms undone when both top and translate present
      function normalizeShutterTransforms(){
        // remove duplicate transforms created by CSS + JS
      }

      // expose for debugging
      window._cameraApp = { photos, takePhoto, openGallery };

    })();
