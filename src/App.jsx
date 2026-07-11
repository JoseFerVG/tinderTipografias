import React, { useState, useEffect } from 'react';
import { FONTS_DATA } from './fonts';
import './App.css';

// 8 Colores requeridos por el usuario
const COLORS = [
  '#d96a73', // Coral
  '#f78041', // Naranja
  '#8fb186', // Verde salvia
  '#f8a861', // Durazno/arena
  '#4f628d', // Azul pizarra oscuro
  '#c1d0e0', // Azul grisáceo claro
  '#6a8dd3', // Azul pervinca
  '#f9fcfd'  // Blanco roto
];

// Previsualizaciones de muestra según el rol
const ROLE_SAMPLES = {
  h1: 'Liderando la Transformación Digital',
  h2: 'Creamos soluciones de vanguardia para impulsar el valor de tu marca.',
  instagram: '«El diseño visual no es solo estética, es el lenguaje silencioso del éxito empresarial.»',
  body: 'La tipografía es el pilar invisible del diseño web. Una buena elección tipográfica no solo mejora la legibilidad, sino que también transmite la personalidad, el profesionalismo y los valores centrales de una corporación.'
};

// Helper para decidir si el color seleccionado es claro o oscuro para adaptar el fondo del preview canvas
const isLightColor = (color) => {
  return ['#f9fcfd', '#c1d0e0', '#f8a861', '#8fb186'].includes(color);
};

function App() {
  // Estados de navegación y usuario
  const [screen, setScreen] = useState('LOGIN'); // 'LOGIN', 'SWIPER', 'ASSIGN', 'DASHBOARD'
  const [username, setUsername] = useState('');
  
  // Estados del Swiper (Tinder)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedFonts, setLikedFonts] = useState([]);
  const [dislikedFonts, setDislikedFonts] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left', 'right', or null
  const [activeStamp, setActiveStamp] = useState(null); // 'LIKE', 'NOPE', or null
  const [activeTab, setActiveTab] = useState('h1'); // 'h1', 'h2', 'instagram', 'body'
  
  // Controles visuales estáticos (Text color)
  const [textColor, setTextColor] = useState(COLORS[4]); // Slate blue por defecto

  // Estados para el torneo de cara a cara (Bracket)
  const [tournamentRole, setTournamentRole] = useState('h1'); // 'h1', 'h2', 'instagram', 'body'
  const [tournamentCandidates, setTournamentCandidates] = useState([]);
  const [tournamentRound, setTournamentRound] = useState(1);
  const [tournamentTotalRounds, setTournamentTotalRounds] = useState(1);
  const [tournamentResults, setTournamentResults] = useState({ h1: '', h2: '', instagram: '', body: '' });
  const [tournamentLikes, setTournamentLikes] = useState([]);
  const [tournamentDislikes, setTournamentDislikes] = useState([]);

  // Historial global de respuestas
  const [responses, setResponses] = useState([]);

  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:10000' : '';

  // Función de Sincronización con el Servidor
  const syncWithServer = async (localList) => {
    const listToSync = localList !== undefined ? localList : responses;
    try {
      const res = await fetch(`${API_BASE}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientResponses: listToSync })
      });
      if (res.ok) {
        const mergedList = await res.json();
        setResponses(mergedList);
        localStorage.setItem('typematch_responses', JSON.stringify(mergedList));
        return mergedList;
      }
    } catch (e) {
      console.warn('Error sincronizando con el servidor (usando copia local):', e);
    }
    return listToSync;
  };

  // Cargar historial de localStorage al iniciar y sincronizar
  useEffect(() => {
    const saved = localStorage.getItem('typematch_responses');
    let localData = [];
    if (saved) {
      try {
        localData = JSON.parse(saved);
        setResponses(localData);
      } catch (e) {
        console.error('Error cargando respuestas locales:', e);
      }
    }
    syncWithServer(localData);
  }, []);

  // Keyboard Shortcuts para el Swiper
  useEffect(() => {
    if (screen !== 'SWIPER') return;

    const handleKeyDown = (e) => {
      // Swipe Left (Nope)
      if (e.key === 'ArrowLeft') {
        handleVote(false);
      }
      // Swipe Right (Like)
      else if (e.key === 'ArrowRight') {
        handleVote(true);
      }
      // Cambiar de tab con Espacio
      else if (e.key === ' ') {
        e.preventDefault();
        const tabs = ['h1', 'h2', 'instagram', 'body'];
        const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
        setActiveTab(tabs[nextIdx]);
      }
      // Seleccionar color con números 1-8
      else if (e.key >= '1' && e.key <= '8') {
        const colorIdx = parseInt(e.key) - 1;
        if (colorIdx >= 0 && colorIdx < COLORS.length) {
          setTextColor(COLORS[colorIdx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, currentIndex, activeTab, textColor, likedFonts, dislikedFonts, swipeDirection]);

  // Polling periódico para sincronización en tiempo real en el Dashboard
  useEffect(() => {
    if (screen !== 'DASHBOARD') return;

    const interval = setInterval(() => {
      syncWithServer();
    }, 4000); // Polling cada 4 segundos

    return () => clearInterval(interval);
  }, [screen, responses]);

  // Shortcuts para el Torneo
  useEffect(() => {
    if (screen !== 'TOURNAMENT' || tournamentCandidates.length < 2) return;

    const handleKeyDown = (e) => {
      if (e.key === '1' || e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        handleSelectTournamentWinner(tournamentCandidates[0]);
      } else if (e.key === '2' || e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        handleSelectTournamentWinner(tournamentCandidates[1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, tournamentCandidates, tournamentRole, tournamentResults]);

  // Manejar el login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setScreen('SWIPER');
    setCurrentIndex(0);
    setLikedFonts([]);
    setDislikedFonts([]);
    setSwipeDirection(null);
    setActiveStamp(null);
  };

  // Manejar el voto (Swipe)
  const handleVote = (isLike) => {
    if (swipeDirection !== null) return; // Esperar a que termine la animación actual

    const currentFont = FONTS_DATA[currentIndex];
    setActiveStamp(isLike ? 'LIKE' : 'NOPE');
    setSwipeDirection(isLike ? 'right' : 'left');

    setTimeout(() => {
      if (isLike) {
        setLikedFonts(prev => [...prev, currentFont.id]);
      } else {
        setDislikedFonts(prev => [...prev, currentFont.id]);
      }

      setSwipeDirection(null);
      setActiveStamp(null);
      
      if (currentIndex < FONTS_DATA.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Fin de la lista de fuentes -> Iniciar Torneo de cara a cara (Bracket)
        const finalLiked = [...likedFonts, isLike ? currentFont.id : null].filter(Boolean);
        setLikedFonts(finalLiked);
        
        const candidatesSource = finalLiked.length > 0 ? finalLiked : ['playfair-display', 'plus-jakarta-sans', 'syne', 'inter', 'montserrat'];
        setTournamentRole('h1');
        setTournamentResults({ h1: '', h2: '', instagram: '', body: '' });
        
        initializeRoleTournament('h1', candidatesSource, { h1: '', h2: '', instagram: '', body: '' }, finalLiked);
      }
    }, 380); // Duración de la animación en milisegundos
  };

  // Helper para buscar el siguiente rol en el torneo
  const getNextRole = (current) => {
    if (current === 'h1') return 'h2';
    if (current === 'h2') return 'instagram';
    if (current === 'instagram') return 'body';
    return null;
  };

  // Helper para mostrar nombres amigables de roles
  const getRoleNameInSpanish = (role) => {
    if (role === 'h1') return 'Título Principal (H1)';
    if (role === 'h2') return 'Subtítulo (H2)';
    if (role === 'instagram') return 'Instagram Post';
    return 'Cuerpo de Texto';
  };

  // Inicializar la ronda de comparaciones para un rol específico
  const initializeRoleTournament = (role, sourceList, currentResults, finalLikes) => {
    const likesToUse = finalLikes || likedFonts;
    
    if (sourceList.length === 1) {
      // Si solo hay una fuente candidata, gana por defecto para este rol y avanzamos al siguiente
      const nextResults = { ...currentResults, [role]: sourceList[0] };
      setTournamentResults(nextResults);
      
      const nextRole = getNextRole(role);
      if (nextRole) {
        const nextSource = likesToUse.length > 0 ? likesToUse : ['playfair-display', 'plus-jakarta-sans', 'syne', 'inter', 'montserrat'];
        initializeRoleTournament(nextRole, nextSource, nextResults, likesToUse);
      } else {
        // Finalizar y guardar todo
        finalizeTournamentDirect(nextResults, likesToUse);
      }
    } else {
      setTournamentRole(role);
      setTournamentCandidates(sourceList);
      setTournamentRound(1);
      setTournamentTotalRounds(sourceList.length - 1);
      setScreen('TOURNAMENT');
    }
  };

  // Seleccionar la fuente ganadora en la comparativa versus
  const handleSelectTournamentWinner = (winnerId) => {
    const pair = [tournamentCandidates[0], tournamentCandidates[1]];
    const loserId = pair[0] === winnerId ? pair[1] : pair[0];
    
    // Eliminamos la fuente perdedora de los candidatos del rol actual
    const nextCandidates = tournamentCandidates.filter(id => id !== loserId);
    
    if (nextCandidates.length === 1) {
      // Tenemos una ganadora para este rol
      const finalWinner = nextCandidates[0];
      const updatedResults = { ...tournamentResults, [tournamentRole]: finalWinner };
      setTournamentResults(updatedResults);
      
      const nextRole = getNextRole(tournamentRole);
      if (nextRole) {
        const nextSource = likedFonts.length > 0 ? likedFonts : ['playfair-display', 'plus-jakarta-sans', 'syne', 'inter', 'montserrat'];
        initializeRoleTournament(nextRole, nextSource, updatedResults);
      } else {
        // Fin de todo el torneo, guardamos la selección
        finalizeTournamentDirect(updatedResults, likedFonts);
      }
    } else {
      // Avanzar al siguiente cara a cara del mismo rol
      setTournamentCandidates(nextCandidates);
      setTournamentRound(prev => prev + 1);
    }
  };

  // Finalizar torneo y persistir en backend / localStorage
  const finalizeTournamentDirect = async (finalResults, finalLikes) => {
    const newResponse = {
      username: username.trim(),
      timestamp: new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      selections: {
        h1: finalResults.h1,
        h2: finalResults.h2,
        instagram: finalResults.instagram,
        body: finalResults.body
      },
      likes: finalLikes || likedFonts,
      dislikes: dislikedFonts
    };

    const updated = [...responses, newResponse];
    setResponses(updated);
    localStorage.setItem('typematch_responses', JSON.stringify(updated));
    
    await syncWithServer(updated);
    setScreen('DASHBOARD');
  };

  // Reiniciar aplicación para un nuevo usuario
  const handleNewUser = () => {
    setUsername('');
    setScreen('LOGIN');
  };

  // Borrar todo el historial de votaciones
  const handleClearHistory = async () => {
    if (window.confirm('¿Estás seguro de que deseas borrar todo el historial de votos? Esta acción no se puede deshacer.')) {
      setResponses([]);
      localStorage.removeItem('typematch_responses');
      try {
        await fetch(`${API_BASE}/api/clear`, { method: 'POST' });
      } catch (e) {
        console.error('Error al borrar en el servidor:', e);
      }
    }
  };

  // Borrar un usuario individual del historial
  const handleDeleteResponse = async (indexToDelete) => {
    const userToDelete = responses[indexToDelete];
    if (!userToDelete) return;

    if (window.confirm(`¿Borrar los votos de ${userToDelete.username}?`)) {
      const updated = responses.filter((_, idx) => idx !== indexToDelete);
      setResponses(updated);
      localStorage.setItem('typematch_responses', JSON.stringify(updated));
      
      try {
        const res = await fetch(`${API_BASE}/api/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: userToDelete.username })
        });
        if (res.ok) {
          const freshList = await res.json();
          setResponses(freshList);
          localStorage.setItem('typematch_responses', JSON.stringify(freshList));
        }
      } catch (e) {
        console.error('Error al borrar en el servidor:', e);
      }
    }
  };

  // Helper para buscar nombre legible de fuente por su ID
  const getFontName = (id) => {
    const f = FONTS_DATA.find(x => x.id === id);
    return f ? f.name : id;
  };

  // Helper para buscar objeto completo de fuente por ID
  const getFontObj = (id) => {
    return FONTS_DATA.find(x => x.id === id) || FONTS_DATA[0];
  };

  // Calcular estadísticas de votos para cada categoría
  const getTally = (roleKey) => {
    const tallies = {};
    responses.forEach(r => {
      const selected = r.selections[roleKey];
      if (selected) {
        tallies[selected] = (tallies[selected] || 0) + 1;
      }
    });

    return Object.entries(tallies)
      .map(([fontId, count]) => ({
        fontId,
        fontName: getFontName(fontId),
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Calcular las fuentes ganadoras por consenso general
  const getConsensusWinners = () => {
    const roles = ['h1', 'h2', 'instagram', 'body'];
    const winners = {};
    
    roles.forEach(role => {
      const tally = getTally(role);
      if (tally.length > 0) {
        winners[role] = tally[0].fontId;
      } else {
        // Fallback por defecto según estilo corporativo
        if (role === 'h1') winners[role] = 'playfair-display';
        else if (role === 'h2') winners[role] = 'plus-jakarta-sans';
        else if (role === 'instagram') winners[role] = 'syne';
        else winners[role] = 'inter';
      }
    });

    return winners;
  };

    const winners = getConsensusWinners();

    // Calcular las estadísticas de "Likes" (Deslizados a la derecha) y "Nopes" (Deslizados a la izquierda)
    const getSwipeStats = () => {
      const stats = {};
      FONTS_DATA.forEach(f => {
        stats[f.id] = {
          fontId: f.id,
          fontName: f.name,
          category: f.category,
          likes: 0,
          dislikes: 0
        };
      });

      responses.forEach(r => {
        let likes = r.likes;
        let dislikes = r.dislikes;

        // Fallback para registros antiguos sin historial de swipes:
        // Inferimos como "Likes" las fuentes asignadas a sus roles.
        if (!likes) {
          likes = Object.values(r.selections).filter(Boolean);
        }
        if (!dislikes) {
          dislikes = [];
        }

        likes.forEach(id => {
          if (stats[id]) stats[id].likes += 1;
        });
        dislikes.forEach(id => {
          if (stats[id]) stats[id].dislikes += 1;
        });
      });

      const statsList = Object.values(stats).map(s => {
        const total = s.likes + s.dislikes;
        const likePercent = total > 0 ? Math.round((s.likes / total) * 100) : 0;
        const dislikePercent = total > 0 ? Math.round((s.dislikes / total) * 100) : 0;
        return {
          ...s,
          total,
          likePercent,
          dislikePercent
        };
      });

      const topLikes = [...statsList]
        .filter(s => s.likes > 0)
        .sort((a, b) => b.likes - a.likes || b.likePercent - a.likePercent)
        .slice(0, 5);

      const topNopes = [...statsList]
        .filter(s => s.dislikes > 0)
        .sort((a, b) => b.dislikes - a.dislikes || b.dislikePercent - a.dislikePercent)
        .slice(0, 5);

      return { statsList, topLikes, topNopes };
    };

    const { statsList, topLikes, topNopes } = getSwipeStats();

  return (
    <>
      <div className="app-container">
        {/* Cabecera Principal */}
        <header className="app-header">
          <div className="brand">
            <h1 className="brand-logo">TypeMatch</h1>
            <span className="brand-dot"></span>
          </div>
          <p className="brand-subtitle">Decisión Colectiva de Tipografías de Marca</p>
          
          {username && screen !== 'LOGIN' && (
            <div className="user-badge">
              <span>Colaborador: <strong>{username}</strong></span>
              {screen === 'DASHBOARD' && (
                <button className="logout-btn" onClick={handleNewUser}>Salir</button>
              )}
            </div>
          )}
        </header>

        {/* ---------------- LOGIN SCREEN ---------------- */}
        {screen === 'LOGIN' && (
          <main className="login-screen glass-card animate-fade-in">
            <h2>Comienza la Selección</h2>
            <p>Descubre las tipografías más usadas en el sector y elige la combinación perfecta para la empresa votando al estilo Tinder.</p>
            
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="username-input">Tu Nombre</label>
                <input
                  id="username-input"
                  className="form-input"
                  type="text"
                  placeholder="Ej. Nacho, Josef, Laura..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  maxLength={30}
                />
              </div>
              <button className="btn-primary" type="submit">
                Comenzar Votación
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
            
            {responses.length > 0 && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(79,98,141,0.1)', paddingTop: '1.25rem' }}>
                <button 
                  className="btn-secondary" 
                  style={{ width: '100%', padding: '0.75rem' }} 
                  onClick={() => setScreen('DASHBOARD')}
                >
                  Ver Resultados Acumulados ({responses.length})
                </button>
              </div>
            )}
          </main>
        )}

        {/* ---------------- SWIPER (TINDER) SCREEN ---------------- */}
        {screen === 'SWIPER' && (
          <main className="swiper-screen animate-fade-in">
            {/* Barra de Progreso */}
            <div className="progress-container">
              <div className="progress-header">
                <span>Tipografía {currentIndex + 1} de {FONTS_DATA.length}</span>
                <span>{Math.round(((currentIndex) / FONTS_DATA.length) * 100)}% Completado</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${((currentIndex) / FONTS_DATA.length) * 100}%` }}
                />
              </div>
            </div>

            {/* CONTROLES ESTÁTICOS (FUERA DE LA TARJETA QUE SE DESLIZA) */}
            <div className="static-controls-panel glass-card">
              {/* Selector de Pestañas de Muestra */}
              <div className="control-group">
                <label className="control-label">Elemento a previsualizar</label>
                <div className="preview-tabs">
                  <button 
                    className={`tab-btn ${activeTab === 'h1' ? 'active' : ''}`}
                    onClick={() => setActiveTab('h1')}
                  >
                    H1 (Título)
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'h2' ? 'active' : ''}`}
                    onClick={() => setActiveTab('h2')}
                  >
                    H2 (Subtítulo)
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'instagram' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instagram')}
                  >
                    Instagram
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`}
                    onClick={() => setActiveTab('body')}
                  >
                    Cuerpo
                  </button>
                </div>
              </div>

              {/* Selector de Color de Texto */}
              <div className="control-group" style={{ marginTop: '0.5rem' }}>
                <label className="control-label">Color de Texto de Muestra</label>
                <div className="colors-grid">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className={`color-swatch ${textColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setTextColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* PILA DE TARJETAS TINDER (AHORA SOLO CONTIENEN LA FUENTE Y EL LIENZO) */}
            <div className="card-stack">
              <div className="card-container">
                {FONTS_DATA.map((font, idx) => {
                  // Solo renderizamos la activa y la siguiente para optimizar rendimiento
                  if (idx < currentIndex || idx > currentIndex + 1) return null;
                  
                  const isActive = idx === currentIndex;
                  const cardStyle = isActive ? {
                    transform: 'scale(1) translateY(0)',
                    zIndex: 2,
                    opacity: 1
                  } : {
                    transform: 'scale(0.96) translateY(12px)',
                    zIndex: 1,
                    opacity: 0.5,
                    pointerEvents: 'none'
                  };

                  return (
                    <div 
                      key={font.id}
                      className={`tinder-card ${isActive && swipeDirection ? `swipe-${swipeDirection}` : ''}`}
                      style={cardStyle}
                    >
                      {/* Sello de Tinder interactivo */}
                      {isActive && activeStamp && (
                        <div className={`card-stamp ${activeStamp.toLowerCase()}`}>
                          {activeStamp === 'LIKE' ? 'ME GUSTA' : 'NOPE'}
                        </div>
                      )}

                      {/* Header de la Tarjeta */}
                      <div className="card-info">
                        <div className="font-meta">
                          <h2 className="font-title">{font.name}</h2>
                          <div className="font-category">{font.category}</div>
                        </div>
                        <span className="font-type-tag">{font.type}</span>
                      </div>

                      {/* Lienzo de Muestra de la Fuente */}
                      <div 
                        className="preview-display"
                        style={{ 
                          backgroundColor: isLightColor(textColor) ? '#181920' : '#f9fcfd',
                          borderRadius: '0 0 12px 12px',
                          border: isLightColor(textColor) ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(79,98,141,0.12)',
                          transition: 'background-color 0.3s ease, border-color 0.3s ease'
                        }}
                      >
                        {activeTab === 'h1' && (
                          <h1 
                            className="preview-h1" 
                            style={{ fontFamily: font.family, color: textColor }}
                          >
                            {font.h1_sample}
                          </h1>
                        )}

                        {activeTab === 'h2' && (
                          <h2 
                            className="preview-h2" 
                            style={{ fontFamily: font.family, color: textColor }}
                          >
                            {font.h2_sample}
                          </h2>
                        )}

                        {activeTab === 'instagram' && (
                          <div className="instagram-post-container" style={{ margin: '0 auto' }}>
                            <div className="insta-post-header">
                              <div className="insta-avatar-story-ring">
                                <div className="insta-avatar-image"></div>
                              </div>
                              <div className="insta-header-info">
                                <span className="insta-username">marca.empresa</span>
                                <span className="insta-location">Estudio de Diseño</span>
                              </div>
                              <div className="insta-options-dot">•••</div>
                            </div>
                            <div className="insta-image-area">
                              <span className="insta-graphic-quote-mark">“</span>
                              <p className="insta-graphic-text" style={{ fontFamily: font.family }}>
                                {font.insta_sample}
                              </p>
                              <div className="insta-graphic-badge">
                                <span>{font.name}</span>
                              </div>
                            </div>
                            <div className="insta-action-bar">
                              <div className="insta-left-actions">
                                <svg className="insta-action-icon heart" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                                <svg className="insta-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                </svg>
                                <svg className="insta-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="22" y1="2" x2="11" y2="13"></line>
                                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                              </div>
                              <svg className="insta-action-icon bookmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                              </svg>
                            </div>
                            <div className="insta-likes-caption">
                              <div className="insta-likes-text">Les gusta a <strong>josef</strong> y <strong>245 personas más</strong></div>
                              <div className="insta-caption-text">
                                <strong>marca.empresa</strong> <span className="insta-caption-body" style={{ fontFamily: font.family }}>{font.insta_sample}</span>
                              </div>
                              <div className="insta-hashtags">#branding #typography #typematch</div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'body' && (
                          <p 
                            className="preview-body" 
                            style={{ fontFamily: font.family, color: textColor }}
                          >
                            {font.body_sample}
                          </p>
                        )}
                      </div>

                      {/* Descripción inferior fija dentro de la tarjeta */}
                      <div className="card-description-footer">
                        <strong>Descripción:</strong> {font.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botones de Votación Fijos */}
            <div className="action-buttons">
              <button 
                className="action-btn dislike" 
                onClick={() => handleVote(false)}
                title="Descartar (Flecha Izquierda)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <button 
                className="action-btn like" 
                onClick={() => handleVote(true)}
                title="Me Gusta (Flecha Derecha)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>

            <div className="shortcuts-tip">
              Atajos: ← No me gusta | → Me gusta | Espacio: Cambiar elemento | 1-8: Cambiar color
            </div>
          </main>
        )}

        {/* ---------------- TOURNAMENT SCREEN ---------------- */}
        {screen === 'TOURNAMENT' && tournamentCandidates.length >= 2 && (
          <main className="tournament-screen animate-fade-in">
            <h2>Elegir Tipografías: Cara a Cara</h2>
            <p>Compara tus tipografías favoritas y selecciona tu preferida para decidir los canales de marca corporativos.</p>

            {/* Stepper para roles */}
            <div className="tournament-stepper">
              <div className={`step-item ${tournamentRole === 'h1' ? 'active' : ''} ${tournamentResults.h1 ? 'completed' : ''}`}>
                <span className="step-num">1</span>
                <span className="step-name">H1 (Título)</span>
              </div>
              <div className={`step-item ${tournamentRole === 'h2' ? 'active' : ''} ${tournamentResults.h2 ? 'completed' : ''}`}>
                <span className="step-num">2</span>
                <span className="step-name">H2 (Subtítulo)</span>
              </div>
              <div className={`step-item ${tournamentRole === 'instagram' ? 'active' : ''} ${tournamentResults.instagram ? 'completed' : ''}`}>
                <span className="step-num">3</span>
                <span className="step-name">Instagram</span>
              </div>
              <div className={`step-item ${tournamentRole === 'body' ? 'active' : ''} ${tournamentResults.body ? 'completed' : ''}`}>
                <span className="step-num">4</span>
                <span className="step-name">Cuerpo</span>
              </div>
            </div>

            {/* Indicador de comparación */}
            <div className="tournament-info-bar">
              <h3 className="tournament-role-title">Decidiendo: {getRoleNameInSpanish(tournamentRole)}</h3>
              <span className="tournament-round-indicator">Eliminatoria {tournamentRound} de {tournamentTotalRounds}</span>
            </div>

            {/* Panel de cara a cara (Versus) */}
            <div className="versus-container">
              {/* Opción Izquierda */}
              {(() => {
                const fontLeft = getFontObj(tournamentCandidates[0]);
                return (
                  <div 
                    className="versus-card option-left"
                    onClick={() => handleSelectTournamentWinner(fontLeft.id)}
                  >
                    <div className="versus-preview-box-container">
                      <span className="versus-option-tag">Opción A</span>
                      {tournamentRole === 'h1' && (
                        <h1 style={{ fontFamily: fontLeft.family, fontSize: '2rem', margin: 0, color: '#16171d', wordBreak: 'break-word', textTransform: 'uppercase' }}>
                          {ROLE_SAMPLES.h1}
                        </h1>
                      )}
                      {tournamentRole === 'h2' && (
                        <h2 style={{ fontFamily: fontLeft.family, fontSize: '1.3rem', margin: 0, color: '#4f628d', wordBreak: 'break-word' }}>
                          {ROLE_SAMPLES.h2}
                        </h2>
                      )}
                      {tournamentRole === 'instagram' && (
                        <div className="instagram-post-container" style={{ margin: '0 auto', pointerEvents: 'none' }}>
                          <div className="insta-post-header">
                            <div className="insta-avatar-story-ring">
                              <div className="insta-avatar-image"></div>
                            </div>
                            <div className="insta-header-info">
                              <span className="insta-username">marca.empresa</span>
                              <span className="insta-location">Estudio de Diseño</span>
                            </div>
                            <div className="insta-options-dot">•••</div>
                          </div>
                          <div className="insta-image-area">
                            <span className="insta-graphic-quote-mark">“</span>
                            <p className="insta-graphic-text" style={{ fontFamily: fontLeft.family, fontSize: '1rem' }}>
                              {ROLE_SAMPLES.instagram}
                            </p>
                            <div className="insta-graphic-badge">
                              <span>{fontLeft.name}</span>
                            </div>
                          </div>
                          <div className="insta-action-bar">
                            <div className="insta-left-actions">
                              <svg className="insta-action-icon heart" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      {tournamentRole === 'body' && (
                        <p style={{ fontFamily: fontLeft.family, fontSize: '0.85rem', margin: 0, color: '#2e303a', lineHeight: 1.5, textAlign: 'left' }}>
                          {ROLE_SAMPLES.body}
                        </p>
                      )}
                    </div>
                    <div className="versus-font-details">
                      <h4 className="font-name">{fontLeft.name}</h4>
                      <span className="font-category">{fontLeft.category} — {fontLeft.type}</span>
                    </div>
                    <span className="shortcut-hint">Pulsar [1] o ←</span>
                  </div>
                );
              })()}

              {/* Divisor VS */}
              <div className="versus-divider">
                <span>VS</span>
              </div>

              {/* Opción Derecha */}
              {(() => {
                const fontRight = getFontObj(tournamentCandidates[1]);
                return (
                  <div 
                    className="versus-card option-right"
                    onClick={() => handleSelectTournamentWinner(fontRight.id)}
                  >
                    <div className="versus-preview-box-container">
                      <span className="versus-option-tag">Opción B</span>
                      {tournamentRole === 'h1' && (
                        <h1 style={{ fontFamily: fontRight.family, fontSize: '2rem', margin: 0, color: '#16171d', wordBreak: 'break-word', textTransform: 'uppercase' }}>
                          {ROLE_SAMPLES.h1}
                        </h1>
                      )}
                      {tournamentRole === 'h2' && (
                        <h2 style={{ fontFamily: fontRight.family, fontSize: '1.3rem', margin: 0, color: '#4f628d', wordBreak: 'break-word' }}>
                          {ROLE_SAMPLES.h2}
                        </h2>
                      )}
                      {tournamentRole === 'instagram' && (
                        <div className="instagram-post-container" style={{ margin: '0 auto', pointerEvents: 'none' }}>
                          <div className="insta-post-header">
                            <div className="insta-avatar-story-ring">
                              <div className="insta-avatar-image"></div>
                            </div>
                            <div className="insta-header-info">
                              <span className="insta-username">marca.empresa</span>
                              <span className="insta-location">Estudio de Diseño</span>
                            </div>
                            <div className="insta-options-dot">•••</div>
                          </div>
                          <div className="insta-image-area">
                            <span className="insta-graphic-quote-mark">“</span>
                            <p className="insta-graphic-text" style={{ fontFamily: fontRight.family, fontSize: '1rem' }}>
                              {ROLE_SAMPLES.instagram}
                            </p>
                            <div className="insta-graphic-badge">
                              <span>{fontRight.name}</span>
                            </div>
                          </div>
                          <div className="insta-action-bar">
                            <div className="insta-left-actions">
                              <svg className="insta-action-icon heart" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      {tournamentRole === 'body' && (
                        <p style={{ fontFamily: fontRight.family, fontSize: '0.85rem', margin: 0, color: '#2e303a', lineHeight: 1.5, textAlign: 'left' }}>
                          {ROLE_SAMPLES.body}
                        </p>
                      )}
                    </div>
                    <div className="versus-font-details">
                      <h4 className="font-name">{fontRight.name}</h4>
                      <span className="font-category">{fontRight.category} — {fontRight.type}</span>
                    </div>
                    <span className="shortcut-hint">Pulsar [2] o →</span>
                  </div>
                );
              })()}
            </div>
          </main>
        )}

        {/* ---------------- DASHBOARD SCREEN ---------------- */}
        {screen === 'DASHBOARD' && (
          <main className="dashboard-screen animate-fade-in">
            <h2>Consenso y Resultados de la Empresa</h2>
            <p>Visualiza qué tipografías han sido las más votadas por todo el equipo y descubre la identidad visual resultante.</p>

            {responses.length === 0 ? (
              <div className="glass-card empty-state" style={{ margin: '3rem auto 0' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p>Aún no hay respuestas registradas. ¡Sé el primero en votar!</p>
                <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={handleNewUser}>
                  Comenzar Nueva Votación
                </button>
              </div>
            ) : (
              <>
                <div className="dashboard-grid">
                  {/* Columna Izquierda: Identidad de Consenso y Tally de Votos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Consenso Visual en Vivo */}
                    <section className="dashboard-card">
                      <h3>
                        Identidad Visual Resultante (Consenso)
                        <span>En base a {responses.length} {responses.length === 1 ? 'voto' : 'votos'}</span>
                      </h3>
                      <p style={{ color: '#4f628d', fontWeight: 500, fontSize: '0.92rem', marginBottom: '1.5rem', opacity: 0.9 }}>
                        Así es como se ven combinadas las fuentes más votadas por el equipo para cada rol:
                      </p>

                      <div className="consensus-preview-box">
                        <span className="consensus-tag">Identidad de Consenso</span>
                        
                        {/* 1. Simulador de Navegador (Página Web) */}
                        <div className="mockup-browser">
                          <div className="mockup-browser-header">
                            <div className="mockup-dot red"></div>
                            <div className="mockup-dot yellow"></div>
                            <div className="mockup-dot green"></div>
                            <div className="mockup-browser-url">empresa.com</div>
                          </div>
                          
                          <div className="mockup-browser-body">
                            {/* Navbar */}
                            <nav className="mockup-nav">
                              <span className="mockup-nav-logo">BRANDING SYNC</span>
                              <div className="mockup-nav-links">
                                <span>Inicio</span>
                                <span>Servicios</span>
                                <span>Contacto</span>
                              </div>
                            </nav>
                            
                            {/* Hero Section */}
                            <div className="mockup-hero">
                              <span className="font-spec-badge h1-badge">H1 — {getFontName(winners.h1)} ({getFontObj(winners.h1).type})</span>
                              <h1 className="consensus-h1" style={{ fontFamily: getFontObj(winners.h1).family, color: '#16171d', margin: '0 0 1rem 0' }}>
                                {ROLE_SAMPLES.h1}
                              </h1>

                              <span className="font-spec-badge h2-badge" style={{ marginTop: '0.5rem' }}>H2 — {getFontName(winners.h2)} ({getFontObj(winners.h2).type})</span>
                              <h2 className="consensus-h2" style={{ fontFamily: getFontObj(winners.h2).family, color: '#4f628d', margin: '0 0 1rem 0' }}>
                                {ROLE_SAMPLES.h2}
                              </h2>

                              <span className="font-spec-badge body-badge" style={{ marginTop: '0.5rem' }}>Texto — {getFontName(winners.body)} ({getFontObj(winners.body).type})</span>
                              <p className="consensus-body" style={{ fontFamily: getFontObj(winners.body).family, color: '#2e303a', margin: '0 0 1.25rem 0' }}>
                                {ROLE_SAMPLES.body}
                              </p>

                              <button className="mockup-cta" style={{ fontFamily: getFontObj(winners.h2).family }}>
                                Comenzar Proyecto
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 2. Simulador de Instagram Post */}
                        <div className="mockup-insta-section">
                          <h4 className="mockup-section-title">Post de Redes Sociales (Instagram)</h4>
                          <div className="mockup-insta-card-container">
                            <div className="instagram-post-container" style={{ margin: '0 auto', width: '100%', maxWidth: '280px' }}>
                              <div className="insta-post-header">
                                <div className="insta-avatar-story-ring">
                                  <div className="insta-avatar-image"></div>
                                </div>
                                <div className="insta-header-info">
                                  <span className="insta-username">marca.empresa</span>
                                  <span className="insta-location">Estudio de Diseño</span>
                                </div>
                                <div className="insta-options-dot">•••</div>
                              </div>
                              <div className="insta-image-area">
                                <span className="insta-graphic-quote-mark">“</span>
                                <p className="insta-graphic-text" style={{ fontFamily: getFontObj(winners.instagram).family, fontSize: '1rem' }}>
                                  {ROLE_SAMPLES.instagram}
                                </p>
                                <div className="insta-graphic-badge">
                                  <span>{getFontName(winners.instagram)}</span>
                                </div>
                              </div>
                              <div className="insta-action-bar">
                                <div className="insta-left-actions">
                                  <svg className="insta-action-icon heart" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                  </svg>
                                  <svg className="insta-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Gráficos de Votos (Tally) */}
                    <section className="dashboard-card">
                      <h3>Desglose de Votación</h3>
                      
                      <div className="tally-list">
                        {/* Tally H1 */}
                        <div className="tally-category">
                          <h4 className="tally-title">H1 — Título Principal</h4>
                          <div className="tally-bars">
                            {getTally('h1').slice(0, 5).map(item => (
                              <div key={item.fontId} className="tally-row">
                                <span className="tally-font-name">{item.fontName}</span>
                                <div className="tally-bar-container">
                                  <div 
                                    className="tally-bar-fill" 
                                    style={{ 
                                      width: `${(item.count / responses.length) * 100}%`,
                                      background: 'linear-gradient(90deg, #6a8dd3, #4f628d)'
                                    }}
                                  />
                                </div>
                                <span className="tally-count">
                                  {item.count} {item.count === 1 ? 'voto' : 'votos'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tally H2 */}
                        <div className="tally-category" style={{ borderTop: '1px solid rgba(79,98,141,0.1)', paddingTop: '1.25rem' }}>
                          <h4 className="tally-title">H2 — Subtítulo</h4>
                          <div className="tally-bars">
                            {getTally('h2').slice(0, 5).map(item => (
                              <div key={item.fontId} className="tally-row">
                                <span className="tally-font-name">{item.fontName}</span>
                                <div className="tally-bar-container">
                                  <div 
                                    className="tally-bar-fill" 
                                    style={{ 
                                      width: `${(item.count / responses.length) * 100}%`,
                                      background: 'linear-gradient(90deg, #8fb186, #4f628d)'
                                    }}
                                  />
                                </div>
                                <span className="tally-count">
                                  {item.count} {item.count === 1 ? 'voto' : 'votos'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tally Instagram */}
                        <div className="tally-category" style={{ borderTop: '1px solid rgba(79,98,141,0.1)', paddingTop: '1.25rem' }}>
                          <h4 className="tally-title">Instagram</h4>
                          <div className="tally-bars">
                            {getTally('instagram').slice(0, 5).map(item => (
                              <div key={item.fontId} className="tally-row">
                                <span className="tally-font-name">{item.fontName}</span>
                                <div className="tally-bar-container">
                                  <div 
                                    className="tally-bar-fill" 
                                    style={{ 
                                      width: `${(item.count / responses.length) * 100}%`,
                                      background: 'linear-gradient(90deg, #f78041, #d96a73)'
                                    }}
                                  />
                                </div>
                                <span className="tally-count">
                                  {item.count} {item.count === 1 ? 'voto' : 'votos'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tally Cuerpo */}
                        <div className="tally-category" style={{ borderTop: '1px solid rgba(79,98,141,0.1)', paddingTop: '1.25rem' }}>
                          <h4 className="tally-title">Cuerpo de Texto</h4>
                          <div className="tally-bars">
                            {getTally('body').slice(0, 5).map(item => (
                              <div key={item.fontId} className="tally-row">
                                <span className="tally-font-name">{item.fontName}</span>
                                <div className="tally-bar-container">
                                  <div 
                                    className="tally-bar-fill" 
                                    style={{ 
                                      width: `${(item.count / responses.length) * 100}%`,
                                      background: 'linear-gradient(90deg, #f8a861, #4f628d)'
                                    }}
                                  />
                                </div>
                                <span className="tally-count">
                                  {item.count} {item.count === 1 ? 'voto' : 'votos'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Estadísticas de Deslizamiento (Tinder Stats) */}
                    <section className="dashboard-card">
                      <h3>Tipografías Más Queridas (Top Likes)</h3>
                      <p style={{ color: '#4f628d', fontWeight: 500, fontSize: '0.92rem', marginBottom: '1.5rem', opacity: 0.9 }}>
                        Las tipografías que han acumulado la mayor cantidad de deslizamientos a la derecha (Likes) por parte del equipo:
                      </p>

                      {topLikes.length === 0 ? (
                        <p className="no-votes-yet">Sin likes registrados</p>
                      ) : (
                        <div className="swipe-top-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {topLikes.map((s, idx) => (
                            <div key={s.fontId} className="swipe-top-item" style={{ padding: '0.75rem 1rem' }}>
                              <span className="swipe-rank font-likes" style={{ width: '24px', height: '24px', fontSize: '0.85rem' }}>{idx + 1}</span>
                              <div className="swipe-font-info">
                                <span className="font-name" style={{ fontSize: '0.92rem' }}>{s.fontName}</span>
                                <span className="font-cat" style={{ fontSize: '0.72rem' }}>{s.category}</span>
                              </div>
                              <span className="swipe-count likes" style={{ fontSize: '0.9rem' }}>
                                {s.likes} {s.likes === 1 ? 'Like' : 'Likes'} 👍
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Columna Derecha: Historial de Colaboradores */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section className="dashboard-card" style={{ height: '100%', maxHeight: '800px', overflowY: 'auto' }}>
                      <h3>Colaboradores ({responses.length})</h3>
                      
                      <div className="history-list">
                        {responses.map((resp, index) => (
                          <div key={index} className="history-item">
                            <div className="history-user-info">
                              <span className="history-username">{resp.username}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="history-timestamp">{resp.timestamp}</span>
                                <button 
                                  onClick={() => handleDeleteResponse(index)}
                                  style={{ background: 'none', border: 'none', color: '#d96a73', cursor: 'pointer', fontSize: '0.85rem' }}
                                  title="Eliminar registro"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            <div className="history-selections">
                              <div className="history-sel-tag">
                                <span className="history-sel-tag-role">H1:</span>
                                <strong>{getFontName(resp.selections.h1)}</strong>
                              </div>
                              <div className="history-sel-tag">
                                <span className="history-sel-tag-role">H2:</span>
                                <strong>{getFontName(resp.selections.h2)}</strong>
                              </div>
                              <div className="history-sel-tag">
                                <span className="history-sel-tag-role">Insta:</span>
                                <strong>{getFontName(resp.selections.instagram)}</strong>
                              </div>
                              <div className="history-sel-tag">
                                <span className="history-sel-tag-role">Texto:</span>
                                <strong>{getFontName(resp.selections.body)}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>

                {/* Acciones del Dashboard */}
                <div className="dashboard-actions">
                  <button className="btn-primary" onClick={handleNewUser}>
                    Registrar Otra Persona
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm11 14h6m-3-3v6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="btn-danger" onClick={handleClearHistory}>
                    Borrar Historial Completo
                  </button>
                </div>
              </>
            )}
          </main>
        )}

        <footer className="app-footer">
          TypeMatch © {new Date().getFullYear()} — Diseñado para decisiones de identidad corporativa.
        </footer>
      </div>
    </>
  );
}

export default App;
