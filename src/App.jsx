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
  const [activeTab, setActiveTab] = useState('h1'); // 'h1', 'h2', 'instagram', 'body'
  
  // Controles visuales (Text color y Filtro)
  const [textColor, setTextColor] = useState(COLORS[4]); // Slate blue por defecto
  const [applyBgFilter, setApplyBgFilter] = useState(false);

  // Estados de asignación de roles
  const [assignedH1, setAssignedH1] = useState('');
  const [assignedH2, setAssignedH2] = useState('');
  const [assignedInstagram, setAssignedInstagram] = useState('');
  const [assignedBody, setAssignedBody] = useState('');

  // Historial global de respuestas
  const [responses, setResponses] = useState([]);

  // Cargar historial de localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('typematch_responses');
    if (saved) {
      try {
        setResponses(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando respuestas:', e);
      }
    }
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
      // Activar / Desactivar filtro de fondo con 'f'
      else if (e.key.toLowerCase() === 'f') {
        setApplyBgFilter(prev => !prev);
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
  }, [screen, currentIndex, activeTab]);

  // Manejar el login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    // Si ya hay respuestas de este usuario, las podemos sobreescribir o simplemente crear una nueva
    setScreen('SWIPER');
    setCurrentIndex(0);
    setLikedFonts([]);
    setDislikedFonts([]);
    setSwipeDirection(null);
  };

  // Manejar el voto (Swipe)
  const handleVote = (isLike) => {
    if (swipeDirection !== null) return; // Esperar a que termine la animación actual

    const currentFont = FONTS_DATA[currentIndex];
    setSwipeDirection(isLike ? 'right' : 'left');

    setTimeout(() => {
      if (isLike) {
        setLikedFonts(prev => [...prev, currentFont.id]);
      } else {
        setDislikedFonts(prev => [...prev, currentFont.id]);
      }

      setSwipeDirection(null);
      
      if (currentIndex < FONTS_DATA.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Fin de la lista de fuentes -> Pasar a asignación de roles
        // Auto-seleccionar candidatos por defecto en la pantalla de asignación
        const liked = [...likedFonts, isLike ? currentFont.id : null].filter(Boolean);
        const fallbackFont = liked.length > 0 ? liked[0] : FONTS_DATA[0].id;
        
        setAssignedH1(fallbackFont);
        setAssignedH2(liked.length > 1 ? liked[1] : fallbackFont);
        setAssignedInstagram(liked.length > 2 ? liked[2] : fallbackFont);
        setAssignedBody(liked.length > 3 ? liked[3] : fallbackFont);
        
        setScreen('ASSIGN');
      }
    }, 350); // Duración de la animación en milisegundos
  };

  // Guardar asignación de roles y ver resultados
  const handleSaveAssignments = () => {
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
        h1: assignedH1,
        h2: assignedH2,
        instagram: assignedInstagram,
        body: assignedBody
      }
    };

    const updated = [...responses, newResponse];
    setResponses(updated);
    localStorage.setItem('typematch_responses', JSON.stringify(updated));
    setScreen('DASHBOARD');
  };

  // Reiniciar aplicación para un nuevo usuario
  const handleNewUser = () => {
    setUsername('');
    setScreen('LOGIN');
  };

  // Borrar todo el historial de votaciones
  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de que deseas borrar todo el historial de votos? Esta acción no se puede deshacer.')) {
      setResponses([]);
      localStorage.removeItem('typematch_responses');
    }
  };

  // Borrar un usuario individual del historial
  const handleDeleteResponse = (indexToDelete) => {
    if (window.confirm('¿Borrar los votos de este colaborador?')) {
      const updated = responses.filter((_, idx) => idx !== indexToDelete);
      setResponses(updated);
      localStorage.setItem('typematch_responses', JSON.stringify(updated));
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

  return (
    <>
      {/* Filtro de Color en Fondo de la pantalla */}
      <div 
        className="background-filter-overlay" 
        style={{ 
          backgroundColor: applyBgFilter ? `${textColor}1C` : 'transparent',
          backdropFilter: applyBgFilter ? 'blur(10px) saturate(110%)' : 'none',
          WebkitBackdropFilter: applyBgFilter ? 'blur(10px) saturate(110%)' : 'none'
        }}
      />

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
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
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

            {/* Pila de Tarjetas */}
            <div className="card-stack">
              <div className="card-container">
                {FONTS_DATA.map((font, idx) => {
                  // Solo renderizar la tarjeta activa y una de fondo para rendimiento
                  if (idx < currentIndex || idx > currentIndex + 1) return null;
                  
                  const isActive = idx === currentIndex;
                  const cardStyle = isActive ? {
                    transform: 'scale(1) translateY(0)',
                    zIndex: 2,
                    opacity: 1
                  } : {
                    transform: 'scale(0.96) translateY(12px)',
                    zIndex: 1,
                    opacity: 0.6,
                    pointerEvents: 'none'
                  };

                  return (
                    <div 
                      key={font.id}
                      className={`tinder-card ${isActive && swipeDirection ? `swipe-${swipeDirection}` : ''}`}
                      style={cardStyle}
                    >
                      {/* Info de la Fuente */}
                      <div className="card-info">
                        <div className="font-meta">
                          <h2 className="font-title">{font.name}</h2>
                          <div className="font-category">{font.category}</div>
                        </div>
                        <span className="font-type-tag">{font.type}</span>
                      </div>

                      {/* Selector de Previsualización */}
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

                      {/* Caja de Visualización */}
                      <div 
                        className="preview-display"
                        style={{ 
                          backgroundColor: isLightColor(textColor) ? '#181920' : '#f9fcfd',
                          borderRadius: '12px',
                          border: isLightColor(textColor) ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(79,98,141,0.15)',
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
                          <div className="preview-insta">
                            <p 
                              className="preview-insta-quote" 
                              style={{ fontFamily: font.family }}
                            >
                              {font.insta_sample}
                            </p>
                            <div className="preview-insta-footer">
                              <div className="preview-insta-avatar"></div>
                              <div>
                                <div className="preview-insta-handle">@marca.empresa</div>
                                <div style={{ fontSize: '0.6rem', color: '#c1d0e0', opacity: 0.5 }}>Tipografía: {font.name}</div>
                              </div>
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

                        {/* Pequeño texto descriptivo de la fuente */}
                        <div className="font-description-tooltip">
                          <strong>{font.name}:</strong> {font.description}
                        </div>
                      </div>

                      {/* Controles de Color y Filtro de Fondo */}
                      <div className="card-controls">
                        <div className="color-picker-section">
                          <label className="control-label">Color de Texto</label>
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

                        <div className="filter-toggle-container">
                          <label className="filter-toggle-label" htmlFor="bg-filter-toggle">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            Filtro de Fondo de Color
                          </label>
                          <label className="switch">
                            <input 
                              id="bg-filter-toggle"
                              type="checkbox" 
                              checked={applyBgFilter}
                              onChange={(e) => setApplyBgFilter(e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botones de Votación */}
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
              Atajos: ← No me gusta | → Me gusta | Espacio: Cambiar preview | 1-8: Cambiar color | F: Filtro de fondo
            </div>
          </main>
        )}

        {/* ---------------- ASSIGNMENT SCREEN ---------------- */}
        {screen === 'ASSIGN' && (
          <main className="assignment-screen animate-fade-in">
            <h2>Asignación de Roles Tipográficos</h2>
            <p>Has calificado todas las tipografías. Ahora, asigna cuál de tus preferidas prefieres para cada canal corporativo:</p>
            
            <div className="assignment-list">
              {/* Asignación H1 */}
              <div className="assignment-item">
                <div className="assignment-meta">
                  <div>
                    <h3 className="assignment-role">H1 — Título Principal</h3>
                    <p className="assignment-role-desc">Cabeceras principales de la web y portadas destacadas.</p>
                  </div>
                </div>
                <div className="select-container">
                  <select 
                    className="assignment-select"
                    value={assignedH1}
                    onChange={(e) => setAssignedH1(e.target.value)}
                  >
                    {FONTS_DATA.map(f => {
                      const isLiked = likedFonts.includes(f.id);
                      return (
                        <option key={f.id} value={f.id}>
                          {isLiked ? '❤️ ' : ''}{f.name} ({f.category})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div 
                  className="role-live-preview" 
                  style={{ fontFamily: getFontObj(assignedH1).family }}
                >
                  {ROLE_SAMPLES.h1}
                  <span className="consensus-font-indicator">Muestra en fuente {getFontName(assignedH1)}</span>
                </div>
              </div>

              {/* Asignación H2 */}
              <div className="assignment-item">
                <div className="assignment-meta">
                  <div>
                    <h3 className="assignment-role">H2 — Subtítulo / Secciones</h3>
                    <p className="assignment-role-desc">Títulos intermedios, subtítulos y cabeceras de segundo nivel.</p>
                  </div>
                </div>
                <div className="select-container">
                  <select 
                    className="assignment-select"
                    value={assignedH2}
                    onChange={(e) => setAssignedH2(e.target.value)}
                  >
                    {FONTS_DATA.map(f => {
                      const isLiked = likedFonts.includes(f.id);
                      return (
                        <option key={f.id} value={f.id}>
                          {isLiked ? '❤️ ' : ''}{f.name} ({f.category})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div 
                  className="role-live-preview" 
                  style={{ fontFamily: getFontObj(assignedH2).family }}
                >
                  {ROLE_SAMPLES.h2}
                  <span className="consensus-font-indicator">Muestra en fuente {getFontName(assignedH2)}</span>
                </div>
              </div>

              {/* Asignación Instagram */}
              <div className="assignment-item">
                <div className="assignment-meta">
                  <div>
                    <h3 className="assignment-role">Redes Sociales / Instagram</h3>
                    <p className="assignment-role-desc">Gráficas, citas e historias en redes visuales.</p>
                  </div>
                </div>
                <div className="select-container">
                  <select 
                    className="assignment-select"
                    value={assignedInstagram}
                    onChange={(e) => setAssignedInstagram(e.target.value)}
                  >
                    {FONTS_DATA.map(f => {
                      const isLiked = likedFonts.includes(f.id);
                      return (
                        <option key={f.id} value={f.id}>
                          {isLiked ? '❤️ ' : ''}{f.name} ({f.category})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div 
                  className="role-live-preview role-live-preview-insta" 
                  style={{ fontFamily: getFontObj(assignedInstagram).family }}
                >
                  {ROLE_SAMPLES.instagram}
                  <span className="consensus-font-indicator">Muestra en fuente {getFontName(assignedInstagram)}</span>
                </div>
              </div>

              {/* Asignación Cuerpo de Texto */}
              <div className="assignment-item">
                <div className="assignment-meta">
                  <div>
                    <h3 className="assignment-role">Cuerpo de Texto (Párrafos)</h3>
                    <p className="assignment-role-desc">Lectura general de artículos, descripciones y textos extensos.</p>
                  </div>
                </div>
                <div className="select-container">
                  <select 
                    className="assignment-select"
                    value={assignedBody}
                    onChange={(e) => setAssignedBody(e.target.value)}
                  >
                    {FONTS_DATA.map(f => {
                      const isLiked = likedFonts.includes(f.id);
                      return (
                        <option key={f.id} value={f.id}>
                          {isLiked ? '❤️ ' : ''}{f.name} ({f.category})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div 
                  className="role-live-preview role-live-preview-body" 
                  style={{ fontFamily: getFontObj(assignedBody).family }}
                >
                  {ROLE_SAMPLES.body}
                  <span className="consensus-font-indicator">Muestra en fuente {getFontName(assignedBody)}</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <button className="btn-primary" onClick={handleSaveAssignments}>
                Guardar Selección y Ver Resultados
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 21 17 13 7 13 7 21" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7 3 7 8 15 8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
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
                      <p style={{ color: '#c1d0e0', opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Así es como se ven combinadas las fuentes más votadas por el equipo para cada rol:
                      </p>

                      <div className="consensus-preview-box">
                        <span className="consensus-tag">Ganadora</span>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h1 className="consensus-h1" style={{ fontFamily: getFontObj(winners.h1).family }}>
                            {ROLE_SAMPLES.h1}
                          </h1>
                          <span className="consensus-font-indicator">H1: {getFontName(winners.h1)} ({getFontObj(winners.h1).category})</span>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <h2 className="consensus-h2" style={{ fontFamily: getFontObj(winners.h2).family }}>
                            {ROLE_SAMPLES.h2}
                          </h2>
                          <span className="consensus-font-indicator">H2: {getFontName(winners.h2)} ({getFontObj(winners.h2).category})</span>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <div className="consensus-insta">
                            <div className="consensus-insta-label">Instagram Post</div>
                            <p style={{ fontFamily: getFontObj(winners.instagram).family, fontSize: '1.1rem', fontStyle: 'italic', margin: 0 }}>
                              {ROLE_SAMPLES.instagram}
                            </p>
                          </div>
                          <span className="consensus-font-indicator">Instagram: {getFontName(winners.instagram)} ({getFontObj(winners.instagram).category})</span>
                        </div>

                        <div>
                          <p className="consensus-body" style={{ fontFamily: getFontObj(winners.body).family, fontSize: '0.95rem' }}>
                            {ROLE_SAMPLES.body}
                          </p>
                          <span className="consensus-font-indicator">Texto: {getFontName(winners.body)} ({getFontObj(winners.body).category})</span>
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
                            {getTally('h1').slice(0, 4).map(item => (
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
                        <div className="tally-category" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                          <h4 className="tally-title">H2 — Subtítulo</h4>
                          <div className="tally-bars">
                            {getTally('h2').slice(0, 4).map(item => (
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
                        <div className="tally-category" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                          <h4 className="tally-title">Instagram</h4>
                          <div className="tally-bars">
                            {getTally('instagram').slice(0, 4).map(item => (
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
                        <div className="tally-category" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                          <h4 className="tally-title">Cuerpo de Texto</h4>
                          <div className="tally-bars">
                            {getTally('body').slice(0, 4).map(item => (
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
