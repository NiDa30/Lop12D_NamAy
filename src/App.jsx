import React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useInView } from 'react-intersection-observer';
import { 
  IoClose, IoChevronBack, IoChevronForward, IoPlayCircle, 
  IoMenu, IoSettingsOutline, IoInformationCircleOutline, 
  IoHeart, IoHeartOutline, IoMusicalNotes, IoPause, IoPlay, 
  IoSearch, IoLogoYoutube, IoSunnyOutline, IoAdd, IoRemove, IoRefreshOutline,
  IoCloudDownloadOutline
} from 'react-icons/io5';
import { mediaData } from './data/media';
import { translations } from './data/locales';
import './App.css';
import './Footer.css'; // New Footer Styles

// -- CONFIG: GOOGLE DRIVE API --
// BẠN CẦN ĐIỀN THÔNG TIN CỦA BẠN VÀO ĐÂY:
const DRIVE_CONFIG = {
  apiKey: 'AIzaSyDtpXmluB_fn5JNP5nKmyxzVd5YU8rDDqA', // API Key của bạn
  folderId: '1_DIWB5SIX0vcLj6FZgVx2rZFaLHtIfE7', // Folder ID của bạn
  enabled: true // Chuyển thành true sau khi đã điền thông tin
};

// -- COMPONENT: MEDIA CARD (MEMOIZED FOR PERFORMANCE) --
// Removed duplicate import
const MediaCardItem = memo(({ item, idx, isFavorite, toggleFavorite, onSelect, showInfo }) => {
  return (
    <motion.div
      layoutId={`card-${item.id}`} 
      className="media-card"
      onClick={() => onSelect(item.id)}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "100px" }}
      transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <button 
        className={`favorite-btn ${isFavorite ? 'active' : ''}`}
        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
      >
        {isFavorite ? <IoHeart size={20} /> : <IoHeartOutline size={20} />}
      </button>

      <img 
        src={item.thumb || item.url} 
        alt={item.caption} 
        className="media-content" 
        loading="lazy" 
        decoding="async"
      />
      
      {showInfo && (
        <div className="card-overlay">
           <div className="card-meta">
              <span className="meta-badge">{item.type}</span>
           </div>
           {item.type === 'video' && (
             <div className="play-icon" style={{
               position: 'absolute', top: '50%', left: '50%', 
               transform: 'translate(-50%, -50%)',
               background: 'rgba(0,0,0,0.5)', borderRadius: '50%',
               width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'
             }}>
               <IoPlay size={24} color="white" />
             </div>
           )}
        </div>
      )}
    </motion.div>
  );
});

// -- CONFIG: BACKGROUND MUSIC (NEW) --
// Bạn có thể đặt nhạc mặc định từ YouTube tại đây
const MUSIC_CONFIG = {
  // 1. YouTube API Key (Dùng để tìm kiếm nhạc)
  ytApiKey: 'AIzaSyDKO3Q0INy120FvzFJIsbUp0GIxdKXhz2s',
  
  // 2. Nhạc YouTube mặc định (Tự động phát khi nhấn "Enter Gallery")
  // Bạn có thể dán link Video hoặc link Playlist YouTube vào đây
  // Ví dụ: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' hoặc 'https://www.youtube.com/playlist?list=...'
  // Để null nếu muốn dùng nhạc MP3 local bên dưới.
  defaultYoutubeLink: 'https://www.youtube.com/playlist?list=PLYkVyCpdBXH-NYMamnUFokSHgyn2Onkgl', 

  // 3. Danh sách nhạc MP3 (Nhạc dự phòng nếu không dùng YouTube)
  // 3. Danh sách nhạc MP3 (Nhạc dự phòng nếu không dùng YouTube)
  localTracks: [],

  // 4. Các nút chọn nhạc nhanh (Quick Mixes) trong bảng YouTube
  quickMixes: [
    { name: "Nhạc Xuân", id: "PLbBxVOjQ4-yueJecOhDRRDf5IuZUF9XFY" },
    { name: "Lofi Girl", id: "PLofht4PTcKYnaH8w5olJCI-4WDneLl8hD" },
    { name: "V-Pop Hits", id: "PLO6cfQMDSzbeMyI2xgl5Ia7fylnoLj5Aa" },
    { name: "Cafe Jazz", id: "PLw-Vm6P5t6wGqZq8z_7aEwO9tH-sTjA_" },
    { name: "Sơn Tùng", id: "UUC4pqbkri8QKEg7rjCteHRA" }
  ]
};

// Constants
const ITEMS_PER_PAGE = 20;

// -- TET THEME ASSETS --
const TET_ASSETS = {
  bg1: 'https://media.loveitopcdn.com/24349/hinh-nen-tet-binh-ngo-2026-4k-full-hd-cuc-dep-5.jpg',
  bg2: 'https://media.loveitopcdn.com/24349/hinh-nen-tet-binh-ngo-2026-4k-full-hd-cuc-dep-8.jpg',
  bg3: 'https://dichvumarketing.net/wp-content/uploads/2025/02/Hinh-anh-Tet-Binh-Ngo.jpg',
  logo: 'https://cdn-i2.congthuong.vn/resize/th/upload/2025/10/28/chao-mung-tet-am-binh-ngo-2026-an-khang-thinh-vuong-12133922.JPG'
};

// -- HELPER: LOCAL STORAGE HOOK --
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };
  return [storedValue, setValue];
}

// -- HELPER: SWIPE --
const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

// -- HELPER: MASONRY --
function generateMasonryColumns(items, userOverride, width) {
  let columnCount = 3;
  if (userOverride !== 'auto') {
    columnCount = parseInt(userOverride);
  } else {
    columnCount = width < 640 ? 1 : width < 1024 ? 2 : 3;
  }
  const columns = Array.from({ length: columnCount }, () => []);
  items.forEach((item, index) => {
    columns[index % columnCount].push(item);
  });
  return columns;
}

function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
}

// -- COMPONENT: SPLASH SCREEN (UPDATED) --
// Thêm nút Enter để bypass chặn Autoplay của trình duyệt
const SplashScreen = ({ onEnter, t }) => (
  <motion.div 
    className="splash-screen fixed-inset-0 flex-center"
    initial={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 1 } }}
    style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: '#000', zIndex: 9999, display: 'flex', 
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}
  >
    <motion.div style={{ textAlign: 'center' }}>
      <motion.h1 
        className="splash-title"
        initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ color: 'white', fontSize: '3rem', marginBottom: '2rem' }}
      >
        {t.splash.title.split(" ").slice(0, -1).join(" ")} <span style={{color: '#a855f7'}}>{t.splash.title.split(" ").slice(-1)}</span>.
      </motion.h1>
      
      {/* Nút bấm để kích hoạt âm thanh */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        onClick={onEnter}
        style={{
          background: 'transparent',
          border: '1px solid #a855f7',
          color: '#a855f7',
          padding: '12px 30px',
          fontSize: '1rem',
          borderRadius: '50px',
          cursor: 'pointer',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          transition: 'all 0.3s'
        }}
        whileHover={{ scale: 1.05, background: 'rgba(168, 85, 247, 0.1)' }}
        whileTap={{ scale: 0.95 }}
      >

        {t.splash.enter}
      </motion.button>
    </motion.div>
  </motion.div>
);

// -- COMPONENT: FOOTER (TET THEME) --
const Footer = ({ t }) => {
  return (
    <footer className="app-footer">
      <div className="footer-bg">
        <img src="https://media.loveitopcdn.com/24349/hinh-nen-tet-binh-ngo-2026-4k-full-hd-cuc-dep-5.jpg" alt="Tet 2026 Background" />
      </div>
      <div className="footer-overlay"></div>
      
      <div className="footer-content">
        <div className="footer-logo">
           {t.splash.title.replace('\n', ' ')}
        </div>
        <div className="footer-desc">
          {t.settings.conceptText}
        </div>
        <div className="footer-copyright">
          {t.settings.footer} &copy; 2026
        </div>
      </div>
    </footer>
  );
};

// -- HELPERS: YOUTUBE ID EXTRACTION --
const extractVideoId = (input) => {
  if (!input) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = input.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const extractPlaylistId = (input) => {
  if (!input) return null;
  const regExp = /list=([a-zA-Z0-9_-]+)/;
  const match = input.match(regExp);
  return match ? match[1] : null;
};

// -- COMPONENT: AUDIO PLAYER FIXED (UPDATED) --
const BackgroundAudio = ({ shouldPlay }) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2);

  const [showYoutube, setShowYoutube] = useState(false);
  const [ytQuery, setYtQuery] = useState('');
  const [playerInit, setPlayerInit] = useState(false);
  const [ytError, setYtError] = useState(false);
  const [isYtPlaying, setIsYtPlaying] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [searchResults, setSearchResults] = useState([]);  
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  
  const audioRef = useRef(null);
  const playerRef = useRef(null); 
  const YT_API_KEY = MUSIC_CONFIG.ytApiKey; 
  
  // Refs for State Tracking (Smart Resume)
  const hasStartedRef = useRef(false);
  const stateRef = useRef({ local: false, yt: false });
  const resumeStateRef = useRef({ local: false, yt: false });
  const searchCache = useRef({}); // Cache for search results

  // Sync Refs with State
  useEffect(() => { stateRef.current.local = playing; }, [playing]);
  useEffect(() => { stateRef.current.yt = isYtPlaying; }, [isYtPlaying]); 


  const quickMixes = MUSIC_CONFIG.quickMixes;

  // -- YOUTUBE CORE FUNCTIONS --
  const createPlayer = useCallback((callback) => {
    if(!window.YT || !window.YT.Player) return;
    
    // Nếu đã có player instance thì không tạo lại (tránh lỗi replace iframe)
    if (playerRef.current) {
        if (callback) callback(playerRef.current);
        return; 
    }

    console.log("Creating YT.Player instance...");
    const pVars = {
      'autoplay': 1, // Bật autoplay để đảm bảo load là chạy
      'playsinline': 1,
      'rel': 0,
      'controls': 1,
      'origin': window.location.origin,
      'enablejsapi': 1
    };

    playerRef.current = new window.YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      playerVars: pVars,
      events: {
        'onReady': (event) => {
             console.log("YouTube Player Ready");
             setPlayerInit(true);
             if(callback) callback(event.target);
             setStatusMsg("");
        },
        'onStateChange': (event) => {
          if (event.data === 1) { // PLAYING
             setIsYtPlaying(true);
             setShowYoutube(false); 
             setPlaying(false); 
             setStatusMsg("Playing from YouTube");
          }
          if (event.data === 2 || event.data === 0) { // PAUSE/END
             setIsYtPlaying(false);
          }
          if (event.data === 5) { // CUED
             event.target.playVideo();
          }
        },
        'onError': (event) => {
            console.error("YouTube Player Error:", event.data);
            setYtError(true);
            setStatusMsg("Video Unavailable. Falling back...");
        }
      }
    });
  }, []);

  const initPlayer = useCallback((callback) => {
    // Nếu API đã sẵn sàng, gọi createPlayer ngay
    if (window.YT && window.YT.Player) {
       createPlayer(callback);
       return;
    }

    // Kiểm tra xem script đã được inject chưa để tránh duplicate
    if (document.getElementById('yt-api-script')) {
      // Nếu script đang load, ta hook vào onYouTubeIframeAPIReady cũ
      const oldReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if(oldReady) oldReady();
        createPlayer(callback);
      };
      return;
    }

    console.log("Initializing YouTube Player...");
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    tag.id = "yt-api-script";
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => createPlayer(callback);
  }, [createPlayer]);

  // Pre-load YouTube Player ngay khi App load (dưới nền)
  useEffect(() => {
     if (!playerInit) {
       initPlayer();
     }
  }, [initPlayer, playerInit]);

  const loadVideo = useCallback((videoId) => {
    console.log("Loading YouTube Video:", videoId);
    const action = (player) => {
      const p = player || playerRef.current;
      if (p && p.loadVideoById) p.loadVideoById(videoId);
    };
    if (!playerInit || !window.YT || !window.YT.Player) initPlayer(action);
    else action();
  }, [playerInit, initPlayer]);

  const loadPlaylist = useCallback((playlistId) => {
    console.log("Loading YouTube Playlist:", playlistId);
    const action = (player) => {
      const p = player || playerRef.current;
      if (p && p.loadPlaylist) p.loadPlaylist({ listType: 'playlist', list: playlistId, index: 0 });
    };
    if (!playerInit || !window.YT || !window.YT.Player) initPlayer(action);
    else action();
  }, [playerInit, initPlayer]);

  // Logic tự động phát (Start / Pause / Resume)
  useEffect(() => {
    // 1. PAUSE LOGIC (Khi shouldPlay = false -> Ví dụ: Đang xem Video)
    if (!shouldPlay) {
       if (hasStartedRef.current) {
          // Lưu trạng thái hiện tại để resume sau
          resumeStateRef.current = { ...stateRef.current };
          console.log("Background Audio: Pausing for external media...", resumeStateRef.current);
          
          if (playerRef.current && playerRef.current.pauseVideo) playerRef.current.pauseVideo();
          if (audioRef.current) audioRef.current.pause();
          setPlaying(false);
       }
       return;
    }

    // 2. RESUME / START LOGIC (Khi shouldPlay = true)
    if (shouldPlay) {
       // A. Initial Start (Lần đầu vào Gallery)
       if (!hasStartedRef.current) {
          console.log("Gallery Entered - Starting Music...");
          hasStartedRef.current = true;
          const defLink = MUSIC_CONFIG.defaultYoutubeLink;
          if (defLink) {
            const vId = extractVideoId(defLink);
            const pId = extractPlaylistId(defLink);
            if (vId) { loadVideo(vId); return; }
            else if (pId) { loadPlaylist(pId); return; }
          }
       } 
       // B. Resume (Sau khi đóng Video)
       else {
          console.log("Resuming Music...", resumeStateRef.current);
          if (resumeStateRef.current.yt) {
             if (playerRef.current && playerRef.current.playVideo) playerRef.current.playVideo();
          }
       }
    }
  }, [shouldPlay]); // Chỉ chạy lại khi shouldPlay thay đổi



  // Sync Volume
  useEffect(() => {
    if(audioRef.current) audioRef.current.volume = volume;
    if(playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume * 100);
    }
  }, [volume]);

  // MUTUAL EXCLUSION (Only one audio source plays at a time)
  useEffect(() => {
    if (playing && isYtPlaying && playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo();
      setIsYtPlaying(false);
    }
    if (playing) {
      if (audioRef.current) audioRef.current.play().catch(() => {});
    } else {
      if (audioRef.current) audioRef.current.pause();
    }
  }, [playing, isYtPlaying]);

  // Toggle Button
  const toggle = () => {
    if (isYtPlaying) {
      if(playerRef.current) playerRef.current.pauseVideo();
      return; 
    }
    if (playing) {
      setPlaying(false);
      return;
    }
    setPlaying(true);
  };

  /* OLD LOCAL TRACK LOGIC REMOVED
  const changeTrack = (direction) => { ... }
  */

  // NEW: YouTube Playlist Control
  const changeTrack = (direction) => {
    if(!playerRef.current) return;
    
    // Nếu chưa bật, bật lên trước
    if(!isYtPlaying) {
       playerRef.current.playVideo();
    }

    // 1. Check if we are playing from Search Results
    if (currentSearchIndex >= 0 && searchResults.length > 0) {
       const newIndex = (currentSearchIndex + direction + searchResults.length) % searchResults.length;
       const nextVideo = searchResults[newIndex];
       if (nextVideo && nextVideo.id && nextVideo.id.videoId) {
          console.log("Playing next search result:", newIndex, nextVideo.snippet.title);
          loadVideo(nextVideo.id.videoId);
          setCurrentSearchIndex(newIndex);
          setStatusMsg("▶️ " + (nextVideo.snippet.title?.slice(0, 30) || 'Playing...'));
          return;
       }
    }

    // 2. Fallback to Native YouTube Playlist (nextVideo/previousVideo)
    if (direction > 0) {
      if(playerRef.current.nextVideo) playerRef.current.nextVideo();
    } else {
      if(playerRef.current.previousVideo) playerRef.current.previousVideo();
    }
  };

  const loadMix = (mix) => {
      setYtError(false);
      setYtQuery(mix.name);
      setStatusMsg(`Loading ${mix.name}...`);
      loadPlaylist(mix.id);
      setCurrentSearchIndex(-1); // Reset search index when loading mix
  };

  const handleSearch = async (e) => {
    if (e.key !== 'Enter' || !ytQuery.trim()) return;
    
    // Prevent double submission / Wait for player
    if (loadingSearch) return; 
    
    if (!playerInit) {
      setStatusMsg("⏳ YouTube loading...");
      return;
    }

    setYtError(false);
    setStatusMsg("🔍 Search...");
    setLoadingSearch(true);

    const videoId = extractVideoId(ytQuery);
    const playlistId = extractPlaylistId(ytQuery);

    if (videoId) {
      loadVideo(videoId);
      setStatusMsg("▶️ Video OK");
      setLoadingSearch(false);
      setCurrentSearchIndex(-1);
      return;
    }
    if (playlistId) {
      loadPlaylist(playlistId);
      setStatusMsg("📱 Playlist...");
      setLoadingSearch(false);
      setCurrentSearchIndex(-1);
      return;
    }

    // -- CACHE CHECK --
    const cacheKey = ytQuery.trim().toLowerCase();
    if (searchCache.current[cacheKey]) {
      console.log("Using cached search results for:", cacheKey);
      const cachedItems = searchCache.current[cacheKey];
      setSearchResults(cachedItems);
      
      const firstId = cachedItems[0]?.id?.videoId;
      if (firstId) {
         loadVideo(firstId);
         setStatusMsg("▶️ " + (cachedItems[0].snippet.title?.slice(0, 30) || 'Playing...'));
         setCurrentSearchIndex(0); // Start at 0
      }
      setLoadingSearch(false);
      return;
    }

    if (!YT_API_KEY || !YT_API_KEY.startsWith('AIzaSy')) {
      setStatusMsg("Paste link/Quick Mix!");
      openYoutubeSearch();
      setLoadingSearch(false);
      return;
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(ytQuery)}&type=video&maxResults=5&videoEmbeddable=true&key=${YT_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.items?.length > 0) {
        setSearchResults(data.items);
        // Save to cache
        searchCache.current[cacheKey] = data.items;

        const firstId = data.items[0].id.videoId;
        if(firstId) {
           loadVideo(firstId);
           setCurrentSearchIndex(0); // Start at 0
        }
        setStatusMsg("▶️ " + (data.items[0].snippet.title?.slice(0, 30) || 'Playing...'));
      } else {
        setStatusMsg("😞 No results");
        setSearchResults([]); // Clear only on hard error/empty
      }
    } catch (err) {
      setStatusMsg("❌ " + err.message.slice(0, 20));
      console.error(err);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const openYoutubeSearch = () => {
      if(!ytQuery) return;
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`, '_blank');
  };

  return (
    <div className={`audio-player ${showYoutube ? 'expanded-yt' : ''}`}>

      
      <div className={`yt-panel ${showYoutube ? 'visible' : 'hidden'}`}>
         <div className="yt-header">
           <IoLogoYoutube color="#f00" />
           <input 
             type="text" 
             placeholder="Search or Link..." 
             value={ytQuery}
             onChange={(e) => setYtQuery(e.target.value)}
             onKeyDown={handleSearch}
             autoFocus
           />
           <button className="yt-close" onClick={() => setShowYoutube(false)} title="Minimize">
             <IoClose />
           </button>
         </div>
         
         <div className="quick-mixes" style={{padding: '0 10px', display: 'flex', gap: 6, flexWrap: 'wrap'}}>
            {quickMixes.map(mix => (
                <button 
                    key={mix.name} 
                    onClick={() => loadMix(mix)}
                    style={{
                        padding: '4px 10px', borderRadius: 20, border: '1px solid #333',
                        background: '#222', color: '#ccc', fontSize: '0.75rem', cursor: 'pointer'
                    }}
                >
                    {mix.name}
                </button>
            ))}
         </div>

         {searchResults.length > 0 && (
           <div style={{padding: '10px', maxHeight: 120, overflowY: 'auto', background: '#111'}}>
             {searchResults.map((item, idx) => (
               <button key={item.id.videoId} onClick={() => {
                   loadVideo(item.id.videoId);
                   setCurrentSearchIndex(idx); // Update index on click
                   setStatusMsg("▶️ " + (item.snippet.title?.slice(0, 30)));
               }}
                 style={{display: 'block', width: '100%', textAlign: 'left', padding: '6px 0', background: 'none', border: 'none', color: '#ccc'}}>
                 ▶️ {item.snippet.title.slice(0, 45)}...
               </button>
             ))}
           </div>
         )}

         {loadingSearch && <div style={{padding: '10px', textAlign: 'center', color: '#aaa'}}>⏳ Tìm kiếm...</div>}

         <div style={{padding: '5px 10px 0', textAlign: 'right'}}>
            <button 
                onClick={openYoutubeSearch}
                style={{
                    background: 'none', border: 'none', color: '#a855f7', 
                    fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline'
                }}
            >
                Mở YouTube
            </button>
         </div>

         <div className="yt-embed-container">
            <div id="youtube-player"></div>
            
            {!playerInit && !ytError && (
               <div className="yt-placeholder">
                 Paste link hoặc Quick Mix!
               </div>
            )}
            
            {statusMsg && (
                <div className="yt-status-overlay" style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, 
                    background: 'rgba(0,0,0,0.8)', color: 'white', 
                    padding: '5px 10px', fontSize: '0.8rem', pointerEvents: 'none', zIndex: 10
                }}>
                  {statusMsg}
                </div>
            )}
             {ytError && (
                <div style={{
                  position: 'absolute', top: 10, left: 10, right: 10, 
                  background: 'rgba(255,0,0,0.2)', color: '#f00', padding: 8, 
                  borderRadius: 4, fontSize: '0.8rem', textAlign: 'center'
                }}>
                  Video chặn → Paste link/Quick Mix
                </div>
              )}
         </div>
      </div>

      {!showYoutube && (
        <div className="audio-track-info">
          {isYtPlaying ? "YouTube Audio" : "Paused"}
        </div>
      )}

      <div className="audio-controls">
         {!showYoutube && (
           <div className="audio-visualizer" style={{opacity: (playing || isYtPlaying) ? 1 : 0.5}}>
              <div className={`bar ${(playing || isYtPlaying) ? '' : 'paused'}`}></div>
              <div className={`bar ${(playing || isYtPlaying) ? '' : 'paused'}`}></div>
              <div className={`bar ${(playing || isYtPlaying) ? '' : 'paused'}`}></div>
           </div>
         )}
         
         <button className="track-btn" onClick={() => changeTrack(-1)}>
            <IoChevronBack size={16} />
         </button>

         <button className="audio-main-btn" onClick={toggle}>
           {showYoutube ? <IoMusicalNotes size={20} /> : ((playing || isYtPlaying) ? <IoPause size={20} /> : <IoPlay size={20} />)}
         </button>
         
         <button className="track-btn" onClick={() => {
           setShowYoutube(!showYoutube); 
         }}>
            <IoSearch size={16} />
         </button>

         <button className="track-btn" onClick={() => changeTrack(1)}>
            <IoChevronForward size={16} />
         </button>
         
         <div className="volume-slider-container">
            <input 
              type="range" 
              min="0" max="1" step="0.05" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
            />
         </div>
      </div>
    </div>
  );
};

// -- COMPONENT: MAIN APP --
function App() {
  const [showSplash, setShowSplash] = useState(true); // Trạng thái Splash Screen
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false); // New state for lang menu
  const [mediaItems, setMediaItems] = useState([]);
  const [fetchingDrive, setFetchingDrive] = useState(false);
  
  const [settings, setSettings] = useLocalStorage('gallery-settings', {
    columns: 'auto',
    autoPlay: false, 
    showInfo: true,
    heroBrightness: 0.9, // Mặc định 90%
    language: 'vi', // Mặc định tiếng Việt
    bgIndex: 0 // Mặc định Background 1
  });

  // Ensure valid language fallback
  const currentLang = settings.language || 'vi';
  const t = translations[currentLang] || translations.vi;

  const updateSetting = (key, value) => setSettings({...settings, [key]: value});

  const [favorites, setFavorites] = useLocalStorage('gallery-favorites', []);

  // -- FETCH DRIVE DATA --
  useEffect(() => {
    const loadMediaData = async () => {
      if (DRIVE_CONFIG.enabled && DRIVE_CONFIG.apiKey && DRIVE_CONFIG.folderId) {
        setFetchingDrive(true);
        console.log("Fetching from Google Drive...");
        const API_URL = `https://www.googleapis.com/drive/v3/files?q='${DRIVE_CONFIG.folderId}'+in+parents+and+trashed=false&key=${DRIVE_CONFIG.apiKey}&fields=files(id,name,mimeType,thumbnailLink,createdTime,modifiedTime)&pageSize=1000`;
        
        try {
          const res = await fetch(API_URL);
          const data = await res.json();
          if (data.files) {
            const driveFiles = data.files.map((file) => {
              const mime = file.mimeType || "";
              const isVideo = mime.includes('video') || mime.includes('mp4') || mime.includes('webm');
              return {
                id: file.id,
                type: isVideo ? 'video' : 'image',
                caption: file.name.replace(/\.[^/.]+$/, ""),
                // Sử dụng modifiedTime vì nó thường phản ánh ngày ảnh được chụp/sửa chính xác hơn
                date: file.modifiedTime ? new Date(file.modifiedTime) : new Date(file.createdTime),
                year: file.modifiedTime ? new Date(file.modifiedTime).getFullYear() : (file.createdTime ? new Date(file.createdTime).getFullYear() : 'Unknown'),
                // Link trực tiếp cho Image và Video
                url: isVideo 
                  ? `https://drive.google.com/uc?id=${file.id}&export=media`
                  : `https://lh3.googleusercontent.com/u/0/d/${file.id}`,
                // Tối ưu Thumbnail: Lấy size s400
                thumb: file.thumbnailLink?.replace('=s220', '=s400') || ""
              };
            });
            setMediaItems(driveFiles);
          } else {
            console.warn("Drive API error or no files found, falling back to local.");
            setMediaItems(mediaData);
          }
        } catch (err) {
          console.error("Drive Fetch Error:", err);
          setMediaItems(mediaData);
        } finally {
          setFetchingDrive(false);
        }
      } else {
        // Fallback to local files from media.js
        setMediaItems(mediaData);
      }
    };
    
    loadMediaData();
  }, []);

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fid => fid !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const processedMedia = useMemo(() => mediaItems, [mediaItems]);

  const [heroImages, setHeroImages] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  /* 
  // OLD RANDOM HERO LOGIC REMOVED - USING TET THEME BACKGROUNDS
  useEffect(() => {
    if (processedMedia.length > 0) { ... }
  }, [processedMedia]);
  */ 

  // SET FIXED TET BACKGROUNDS
  useEffect(() => {
     setHeroImages([
       { id: 'tet-bg-1', url: TET_ASSETS.bg1, type: 'image' },
       { id: 'tet-bg-2', url: TET_ASSETS.bg2, type: 'image' },
       { id: 'tet-bg-3', url: TET_ASSETS.bg3, type: 'image' }
     ]);
  }, []);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % heroImages.length);
    }, 6000); 
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const nextHero = () => {
    if (heroImages.length > 0)
      setCurrentHeroIndex(prev => (prev + 1) % heroImages.length);
  };

  const prevHero = () => {
    if (heroImages.length > 0)
      setCurrentHeroIndex(prev => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const touchStartDist = useRef(0);
  const initialZoom = useRef(1);
  
  // -- ZOOM CONTROLS VISIBILITY --
  const [showZoomControls, setShowZoomControls] = useState(false);
  const zoomControlsTimeoutRef = useRef(null);

  const activateZoomControls = useCallback(() => {
    setShowZoomControls(true);
    if (zoomControlsTimeoutRef.current) clearTimeout(zoomControlsTimeoutRef.current);
    zoomControlsTimeoutRef.current = setTimeout(() => {
      setShowZoomControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (zoomControlsTimeoutRef.current) clearTimeout(zoomControlsTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setZoom(1);
    touchStartDist.current = 0;
  }, [selectedId]);

  const [filter, setFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' hoặc 'oldest'

  const availableYears = useMemo(() => {
    const years = new Set();
    mediaItems.forEach(item => {
      if (item.year && item.year !== 'Unknown') {
        years.add(item.year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [mediaItems]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const { ref: loaderRef, inView } = useInView({ threshold: 0.2 });
  const [width] = useWindowSize();
  const { scrollY } = useScroll();
  
  const yHero = useTransform(scrollY, [0, 500], [0, 200]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => scrollY.onChange((latest) => setIsScrolled(latest > 50)), [scrollY]);

  const filteredItems = useMemo(() => {
    let result = [...processedMedia];
    
    // Sort by date
    result.sort((a, b) => {
      const dateA = a.date || 0;
      const dateB = b.date || 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Filter by type/favorites
    if (filter === 'favorites') {
      result = result.filter(i => favorites.includes(i.id));
    } else if (filter !== 'all') {
      result = result.filter(item => item.type === filter);
    }
    
    // Filter by year
    if (yearFilter !== 'all') {
      result = result.filter(item => item.year === yearFilter);
    }
    
    return result;
  }, [filter, yearFilter, sortOrder, processedMedia, favorites]);

  const visibleItems = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount]);
  const columns = useMemo(() => generateMasonryColumns(visibleItems, settings.columns, width), [visibleItems, settings.columns, width]);

  useEffect(() => {
    if (inView) setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredItems.length));
  }, [inView, filteredItems.length]);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filter]);

  const selectedItem = useMemo(() => filteredItems.find(i => i.id === selectedId), [selectedId, filteredItems]);
  const handleNav = useCallback((dir) => {
    if (!selectedId) return;
    const idx = filteredItems.findIndex(i => i.id === selectedId);
    if (idx === -1) return;
    const newIdx = (idx + dir + filteredItems.length) % filteredItems.length;
    setSelectedId(filteredItems[newIdx].id);
  }, [selectedId, filteredItems]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
         if(selectedId) setSelectedId(null);
         else if(isMenuOpen) setIsMenuOpen(false);
      }
      if (e.key === 'ArrowLeft') handleNav(-1);
      if (e.key === 'ArrowRight') handleNav(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNav, isMenuOpen, selectedId]);

  return (
    <>
      <AnimatePresence>
        {/* Splash Screen giữ lại cho đến khi user click */}
        {showSplash && <SplashScreen onEnter={() => setShowSplash(false)} t={t} />}
      </AnimatePresence>
      
      {/* DYNAMIC BACKGROUND STYLE */}
      <style>{`
        body {
          background-image: url('${Object.values(TET_ASSETS)[settings.bgIndex ?? 0] || TET_ASSETS.bg1}');
          background-size: cover;
          background-position: center top;
          background-attachment: fixed;
          background-repeat: no-repeat;
          transition: background-image 0.5s ease-in-out;
        }
      `}</style>

      <div className={`app-container ${showSplash || selectedId ? 'overflow-hidden h-screen' : ''}`}>
        
        <div className="ambient-light">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
        </div>

        {/* Truyền prop shouldPlay: Tắt nhạc khi Audio Splash chưa tắt HOẶC đang xem Video trong Modal */}
        <BackgroundAudio shouldPlay={!showSplash && !(selectedId && selectedItem?.type === 'video')} />

        {/* Debug Status for Drive */}


        <nav className={`sticky-header ${isScrolled ? 'scrolled' : ''}`}>
          <div className="brand">
            <img src={TET_ASSETS.logo} alt="Tet Logo" className="nav-logo" />
            Class<span>Memories</span>.
          </div>
          <div className="header-right">
             <div className="header-stats hidden sm:block">
               {/* DATE DISPLAY - TET THEME */}
               <span style={{ 
                 color: '#FFD700', 
                 fontFamily: 'Dancing Script, cursive', 
                 fontSize: '1.1rem',
                 marginRight: '20px',
                 textShadow: '0 1px 2px rgba(0,0,0,0.8)'
               }}>
                 {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
               </span>
               <span style={{opacity: 0.7, fontSize: '0.8rem', letterSpacing: '1px'}}>
                 {filteredItems.length} MOMENTS
               </span>
             </div>
             

             
             {/* LANGUAGE SELECTOR */}
             <div style={{position: 'relative'}}>
                <button 
                  className="menu-btn" 
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  style={{marginRight: 10, background: showLangMenu ? 'rgba(168, 85, 247, 0.2)' : ''}}
                  title={t.settings.language}
                >
                  <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{currentLang.toUpperCase()}</span>
                </button>
                
                <AnimatePresence>
                  {showLangMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: 15,
                        background: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(10px)',
                        padding: '5px', borderRadius: 8, border: '1px solid #333',
                        minWidth: 120, zIndex: 1002, display: 'flex', flexDirection: 'column', gap: 2
                      }}
                    >
                      {['vi', 'en', 'ja'].map(lang => (
                        <button 
                          key={lang}
                          onClick={() => { updateSetting('language', lang); setShowLangMenu(false); }}
                          style={{
                            background: settings.language === lang ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                            border: 'none', color: settings.language === lang ? '#fff' : '#aaa',
                            padding: '8px 12px', textAlign: 'left', cursor: 'pointer', borderRadius: 4,
                            fontSize: '0.85rem'
                          }}
                        >
                          {lang === 'vi' ? '🇻🇳 Tiếng Việt' : lang === 'en' ? '🇬🇧 English' : '🇯🇵 日本語'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             {/* QUICK BRIGHTNESS CONTROL */}
             <div style={{position: 'relative'}}>
                <button 
                  className="menu-btn" 
                  onClick={() => setShowBrightnessSlider(!showBrightnessSlider)}
                  style={{marginRight: 10, background: showBrightnessSlider ? 'rgba(168, 85, 247, 0.2)' : ''}}
                >
                  <IoSunnyOutline size={20} />
                </button>
                
                <AnimatePresence>
                  {showBrightnessSlider && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: 15,
                        background: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(10px)',
                        padding: '15px', borderRadius: 12, border: '1px solid #333',
                        minWidth: 200, zIndex: 1001, boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10}}>
                        <span style={{fontSize: '0.75rem', color: '#aaa', fontWeight: 500}}>Banner Brightness</span>
                        <span style={{fontSize: '0.75rem', color: '#a855f7', fontWeight: 'bold'}}>{Math.round(settings.heroBrightness * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="1" step="0.05"
                        value={settings.heroBrightness}
                        onChange={(e) => updateSetting('heroBrightness', parseFloat(e.target.value))}
                        style={{width: '100%', accentColor: '#a855f7', cursor: 'pointer'}}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             <button className="menu-btn" onClick={() => setIsMenuOpen(true)}>
               <IoMenu size={24} />
             </button>
          </div>
        </nav>

        <div className={`drawer-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
        <div className={`settings-drawer ${isMenuOpen ? 'open' : ''}`}>
           <div className="drawer-header">
             <span className="drawer-title">{t.settings.title}</span>
             <button className="drawer-close" onClick={() => setIsMenuOpen(false)}>
               <IoClose size={20} />
             </button>
           </div>
           
           <div className="drawer-content">

             {/* DRIVE STATUS IN DRAWER */}
             {DRIVE_CONFIG.enabled && (
                <div className="setting-section" style={{
                  background: 'rgba(255, 215, 0, 0.05)', 
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: 8,
                  padding: 12
                }}>
                  <div className="setting-title" style={{color: '#FFD700', marginBottom: 5}}>
                     <IoCloudDownloadOutline style={{marginBottom: -2, marginRight: 6}} />
                     Google Drive Status
                  </div>
                  <div style={{ fontSize: '0.8rem', color: fetchingDrive ? '#FFC107' : (mediaItems.length > 0 ? '#4caf50' : '#f44336') }}>
                    {fetchingDrive ? t.status.driveFetching : (mediaItems.length > 0 ? t.status.driveLoaded.replace('{n}', mediaItems.length) : t.status.driveFailed)}
                  </div>
                </div>
             )}
             
             <div className="setting-section">
               <div className="setting-title"><IoInformationCircleOutline style={{marginBottom: -2, marginRight: 6}} /> Background</div>
               <div className="grid-selector" style={{gridTemplateColumns: 'repeat(3, 1fr)', gap: 8}}>
                 {[0, 1, 2].map(idx => (
                   <button 
                     key={idx}
                     className={`grid-btn ${settings.bgIndex === idx ? 'active' : ''}`}
                     onClick={() => updateSetting('bgIndex', idx)}
                     style={{
                        backgroundImage: `url(${Object.values(TET_ASSETS)[idx]})`,
                        backgroundSize: 'cover',
                        height: 50,
                        border: settings.bgIndex === idx ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.2)',
                        color: 'transparent'
                     }}
                   >
                   </button>
                 ))}
               </div>
             </div>

             <div className="setting-section">
               <div className="setting-title"><IoSettingsOutline style={{marginBottom: -2, marginRight: 6}} /> {t.settings.display}</div>
               
               <div className="setting-row">
                 <span className="setting-label">{t.settings.gridColumns}</span>
               </div>
               <div className="grid-selector">
                 {['auto', '2', '3', '4'].map(opt => (
                   <button 
                     key={opt}
                     className={`grid-btn ${settings.columns === opt ? 'active' : ''}`}
                     onClick={() => updateSetting('columns', opt)}
                   >
                     {opt === 'auto' ? 'Auto' : opt}
                   </button>
                 ))}
               </div>

               <div className="setting-row" style={{marginTop: 20}}>
                 <span className="setting-label">Banner Brightness</span>
                 <span style={{fontSize: '0.7rem', color: '#888'}}>{Math.round(settings.heroBrightness * 100)}%</span>
               </div>
               <div style={{padding: '10px 0'}}>
                  <input 
                    type="range" min="0.1" max="1" step="0.05"
                    value={settings.heroBrightness}
                    onChange={(e) => updateSetting('heroBrightness', parseFloat(e.target.value))}
                    style={{width: '100%', accentColor: '#a855f7'}}
                  />
               </div>
             </div>

             <div className="setting-section">
               <div className="setting-title">Playback</div>
               <div className="setting-row">
                 <span className="setting-label">Autoplay Videos</span>
                 <button className="toggle-switch" role="switch" aria-checked={settings.autoPlay} onClick={() => updateSetting('autoPlay', !settings.autoPlay)} />
               </div>
               <div className="setting-row">
                 <span className="setting-label">Show Captions</span>
                 <button className="toggle-switch" role="switch" aria-checked={settings.showInfo} onClick={() => updateSetting('showInfo', !settings.showInfo)} />
               </div>
             </div>

             <div className="setting-section">
               <div className="setting-title"><IoInformationCircleOutline style={{marginBottom: -2, marginRight: 6}} /> Concept</div>
               <p style={{fontSize: '0.85rem', color: '#888', lineHeight: 1.6, fontStyle: 'italic'}}>
                 "A space to slow down and remember."
               </p>
             </div>

           </div>
           <div className="drawer-footer">v2.0 • Cinematic Edition</div>
        </div>

        <section className="hero-section">
          {heroImages.map((img, index) => (
            <div 
              key={img.id}
              className={`absolute-inset-0 z-0 hero-slide ${index === currentHeroIndex ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${img.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `brightness(${settings.heroBrightness})` // Áp dụng độ sáng
              }}
            />
          ))}
          
          <div className="hero-overlay" />

          <motion.div style={{ y: yHero, opacity: opacityHero }} className="hero-content relative z-10">
            <h1 className="hero-title">
               {t.hero.title.split('\n').map((line, i) => (
                 <React.Fragment key={i}>{line}{i === 0 && <br/>}</React.Fragment>
               ))}
            </h1>
            <p className="hero-subtitle">
              {t.hero.subtitle}
            </p>
            
            <div className="filter-bar">
              {['all', 'image', 'video', 'favorites'].map((type) => (
                <button
                  key={type}
                  className={`tab-btn ${filter === type ? 'active' : ''}`}
                  onClick={() => setFilter(type)}
                >
                  {type === 'favorites' ? <IoHeart style={{marginBottom: -2}} /> : 
                   t.filters[type] || type}
                </button>
              ))}
              
              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />
              
              <button
                className="tab-btn"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                style={{ fontSize: '0.75rem', padding: '10px 16px' }}
              >
                {sortOrder === 'newest' ? t.hero.sortNewest : t.hero.sortOldest}
              </button>
            </div>

            {availableYears.length > 0 && (
              <div className="filter-bar year-filter" style={{ marginTop: '10px', padding: '2px', background: 'rgba(0,0,0,0.2)' }}>
                <button
                  className={`tab-btn ${yearFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setYearFilter('all')}
                  style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                >
                   {t.hero.allYears}
                </button>
                {availableYears.map(year => (
                  <button
                    key={year}
                    className={`tab-btn ${yearFilter === year ? 'active' : ''}`}
                    onClick={() => setYearFilter(year)}
                    style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}

            {heroImages.length > 1 && (
              <div className="hero-controls">
                <button className="hero-nav-btn" onClick={prevHero}><IoChevronBack /></button>
                <div className="hero-dots">
                   {heroImages.map((_, idx) => (
                     <div 
                       key={idx} 
                       className={`hero-dot ${idx === currentHeroIndex ? 'active' : ''}`}
                       onClick={() => setCurrentHeroIndex(idx)}
                     />
                   ))}
                </div>
                <button className="hero-nav-btn" onClick={nextHero}><IoChevronForward /></button>
              </div>
            )}
          </motion.div>
        </section>

        <div className="gallery-wrapper">
          {filteredItems.length === 0 ? (
             <div className="empty-state" style={{
                textAlign: 'center', padding: '100px 20px', color: '#ccc',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
             }}>
                <IoInformationCircleOutline size={48} style={{ marginBottom: 15, opacity: 0.7 }} />
                <h3 style={{fontSize: '1.5rem', marginBottom: 10, fontFamily: 'Dancing Script, cursive', color: '#FFD700'}}>
                   Chưa có khoảnh khắc nào
                </h3>
                <p style={{fontSize: '0.9rem', maxWidth: 400, margin: '0 auto', opacity: 0.8}}>
                   {fetchingDrive ? "Đang tải dữ liệu từ Google Drive..." : "Không tìm thấy ảnh/video nào trong Drive hoặc thư mục Cloud."}
                </p>
                {!fetchingDrive && DRIVE_CONFIG.enabled && (
                   <button 
                     onClick={() => window.location.reload()}
                     style={{
                        marginTop: 20, padding: '8px 20px', borderRadius: 20, 
                        background: 'rgba(255,215,0,0.1)', border: '1px solid #FFD700', color: '#FFD700',
                        cursor: 'pointer'
                     }}
                   >
                     Thử tải lại
                   </button>
                )}
             </div>
          ) : (
            <>
              <div className="masonry-grid">
                {columns.map((col, colIndex) => (
                  <div key={colIndex} className="masonry-column" style={{flex: 1}}>
                    {col.map((item, idx) => (
                      <MediaCardItem 
                        key={item.id}
                        item={item}
                        idx={idx}
                        isFavorite={favorites.includes(item.id)}
                        toggleFavorite={toggleFavorite}
                        onSelect={setSelectedId}
                        showInfo={settings.showInfo}
                      />
                    ))}
                  </div>
                ))}
              </div>
              
              <div ref={loaderRef} className="loader-area">
                 {visibleCount < filteredItems.length && <div className="spinner"></div>}
              </div>
            </>
          )}
        </div>

        <AnimatePresence>
          {selectedId && selectedItem && (
            <motion.div 
               className="modal-overlay"
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               transition={{ duration: 0.3 }}
            >
              <div className="modal-backdrop" onClick={() => setSelectedId(null)} />
              
              <button className="close-btn" onClick={() => setSelectedId(null)}>
                <IoClose size={24} />
              </button>
              <button className="nav-btn prev-btn" onClick={(e) => { e.stopPropagation(); handleNav(-1); }}>
                <IoChevronBack size={24} />
              </button>
              <button className="nav-btn next-btn" onClick={(e) => { e.stopPropagation(); handleNav(1); }}>
                <IoChevronForward size={24} />
              </button>
              
              {/* ZOOM CONTROLS (Only for images) */}
              {/* ZOOM CONTROLS (Only for images) - Auto-hide */}
              {selectedItem.type === 'image' && (
                <AnimatePresence>
                  {showZoomControls && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      style={{
                        position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: 15, background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '40px',
                        zIndex: 200, border: '1px solid rgba(255,255,255,0.1)'
                      }}
                      onClick={(e) => { e.stopPropagation(); activateZoomControls(); }}
                    >
                      <button onClick={() => { setZoom(Math.max(1, zoom - 0.5)); activateZoomControls(); }} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex'}} title="Zoom Out"><IoRemove size={20}/></button>
                      <span style={{fontSize: '0.8rem', color: 'white', minWidth: 40, textAlign: 'center'}}>{Math.round(zoom * 100)}%</span>
                      <button onClick={() => { setZoom(Math.min(4, zoom + 0.5)); activateZoomControls(); }} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex'}} title="Zoom In"><IoAdd size={20}/></button>
                      <div style={{width: 1, height: 15, background: 'rgba(255,255,255,0.2)'}} />
                      <button onClick={() => { setZoom(1); activateZoomControls(); }} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex'}} title="Reset"><IoRefreshOutline size={20}/></button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
              
              <motion.div 
                className="modal-content-wrapper"
                layoutId={`card-${selectedId}`} 
                drag={zoom === 1 ? "x" : true} // Drag tự do khi zoom, drag ngang khi không zoom
                dragConstraints={zoom === 1 ? { left: 0, right: 0 } : false}
                dragElastic={zoom === 1 ? 0.2 : 0}
                onDragEnd={(e, { offset, velocity }) => {
                  if (zoom === 1) {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) handleNav(1); 
                    else if (swipe > swipeConfidenceThreshold) handleNav(-1);
                  }
                }}
                style={{ cursor: zoom > 1 ? 'grab' : 'auto' }}
              >
                  {selectedItem.type === 'video' ? (
                     <div style={{ width: '100%', height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                       <iframe 
                         src={`https://drive.google.com/file/d/${selectedItem.id}/preview`}
                         className="modal-media"
                         style={{
                           width: '90vw', 
                           height: '80vh', 
                           border: 'none',
                           borderRadius: '12px',
                           pointerEvents: 'auto'
                         }}
                         allow="autoplay"
                       ></iframe>
                     </div>
                  ) : (
                     <motion.img 
                       src={selectedItem.url} 
                       className="modal-media"
                       draggable={false}
                       animate={{ scale: zoom }}
                       transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                       style={{ 
                         transformOrigin: 'center center',
                         touchAction: 'none' // Chặn scroll trình duyệt khi pinch
                       }}
                       onClick={() => activateZoomControls()} // Tap to show controls
                       onTouchStart={(e) => {
                         if (e.touches.length === 2) {
                           activateZoomControls();
                           const dist = Math.hypot(
                             e.touches[0].clientX - e.touches[1].clientX,
                             e.touches[0].clientY - e.touches[1].clientY
                           );
                           touchStartDist.current = dist;
                           initialZoom.current = zoom;
                         }
                       }}
                       onTouchMove={(e) => {
                         if (e.touches.length === 2 && touchStartDist.current > 0) {
                           activateZoomControls();
                           const dist = Math.hypot(
                             e.touches[0].clientX - e.touches[1].clientX,
                             e.touches[0].clientY - e.touches[1].clientY
                           );
                           const factor = dist / touchStartDist.current;
                           // Giới hạn zoom từ 1x đến 4x
                           setZoom(Math.min(4, Math.max(1, initialZoom.current * factor)));
                         }
                       }}
                       onTouchEnd={() => {
                         touchStartDist.current = 0;
                       }}
                     />
                  )}
              </motion.div>
              
              {settings.showInfo && selectedItem.caption && (
                <div className="modal-caption-container">
                  {selectedItem.caption}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>


        
        <Footer t={t} />

      </div>
    </>
  );
}

export default App;
