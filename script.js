/**
 * CONTROL ASISTENCIA DOCENTES
 * Integración con Google Sheets - Con registro de hora de ingreso
 */

// ============================================
// CONFIGURACIÓN INTERNA - OCULTA PARA EL USUARIO
// ============================================
const HOJA_CSV_URL = "https://docs.google.com/spreadsheets/d/1s9UTRK7U542VepLoHJkdLNHwO5BnWxAv5f2dRSR3UF0/export?format=csv";

// Estado global
let docentes = [];
let cursosDisponibles = [];
let cursoSeleccionado = 'all';
let busquedaActual = '';

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function obtenerHoraActual() {
    const ahora = new Date();
    return ahora.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function obtenerFechaActual() {
    const ahora = new Date();
    return ahora.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// ============================================
// FUNCIONES DE PERSISTENCIA LOCAL
// ============================================
function guardarLocal() {
    localStorage.setItem('docentesPorCurso', JSON.stringify(docentes));
    localStorage.setItem('cursosDisponibles', JSON.stringify(cursosDisponibles));
}

function cargarLocalRespaldo() {
    const guardadoDocentes = localStorage.getItem('docentesPorCurso');
    const guardadoCursos = localStorage.getItem('cursosDisponibles');
    
    if (guardadoDocentes && JSON.parse(guardadoDocentes).length > 0) {
        docentes = JSON.parse(guardadoDocentes);
    } else {
        docentes = obtenerDatosEjemplo();
    }
    
    if (guardadoCursos && JSON.parse(guardadoCursos).length > 0) {
        cursosDisponibles = JSON.parse(guardadoCursos);
    } else {
        cursosDisponibles = [...new Set(docentes.map(d => d.curso))];
    }
    
    actualizarUI();
}

function obtenerDatosEjemplo() {
    return [
        { id: 1, nombre: "Alarcón Marcapura Jesús", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 2, nombre: "Arellano Salas Brando", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 3, nombre: "Arellano Salas Brenda", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 4, nombre: "Bazán Herrera Rubén", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 5, nombre: "Fernández Rodríguez Mario", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 6, nombre: "Huamán Javier Percy Renatto", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 7, nombre: "Huamaní Taipe Francisco", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 8, nombre: "López Baca Juan Martín (A.P.)", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 9, nombre: "López Paredes, Gabriel", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 10, nombre: "López Shapiama Cristian ©", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 11, nombre: "Luján Guevara Anselmo", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 12, nombre: "Mamani Mallma Alexander", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 13, nombre: "Noriega Gonzales Francisco", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 14, nombre: "Paz Camacho José", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 15, nombre: "Salvatierra Velarde Ángel", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 16, nombre: "Sotelo Aguilar Medalith", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 17, nombre: "Susanibar Nieves Daysi Beatriz", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 18, nombre: "Vásquez García Carlos", curso: "ECONOMÍA", asistio: false, hora: "", fecha: "" },
        { id: 19, nombre: "Altamirano Romero José", curso: "GEOGRAFÍA", asistio: false, hora: "", fecha: "" }
    ];
}

// ============================================
// FUNCIONES DE ACTUALIZACIÓN DE UI
// ============================================
function getDocentesFiltrados() {
    if (cursoSeleccionado === 'all') {
        return docentes;
    }
    return docentes.filter(d => d.curso === cursoSeleccionado);
}

function actualizarEstadisticas() {
    const filtrados = getDocentesFiltrados();
    const total = filtrados.length;
    const presentes = filtrados.filter(d => d.asistio).length;
    const ausentes = total - presentes;
    const porcentaje = total === 0 ? 0 : Math.round((presentes / total) * 100);
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('presentCount').textContent = presentes;
    document.getElementById('absentCount').textContent = ausentes;
    document.getElementById('percentCount').textContent = `${porcentaje}%`;
    
    const infoDiv = document.getElementById('infoCurso');
    if (cursoSeleccionado === 'all') {
        infoDiv.innerHTML = `📊 TOTAL GENERAL: ${total} docentes | ${presentes} presentes | ${ausentes} ausentes | ${porcentaje}% asistencia`;
    } else {
        infoDiv.innerHTML = `📚 CURSO: ${cursoSeleccionado} | ${total} docentes | ${presentes} presentes | ${ausentes} ausentes | ${porcentaje}% asistencia`;
    }
}

function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function renderizarTabla() {
    let filtrados = getDocentesFiltrados();
    
    if (busquedaActual) {
        filtrados = filtrados.filter(d => 
            d.nombre.toLowerCase().includes(busquedaActual.toLowerCase()) ||
            d.curso.toLowerCase().includes(busquedaActual.toLowerCase())
        );
    }
    
    const tbody = document.getElementById('tableBody');
    
    if (filtrados.length === 0) {
        let mensaje = cursoSeleccionado === 'all' 
            ? 'No hay docentes registrados en el sistema'
            : `No hay docentes registrados en el curso "${cursoSeleccionado}"`;
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${mensaje}</td><tr>`;
        return;
    }
    
    tbody.innerHTML = filtrados.map((docente, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><span class="curso-badge">${escapeHtml(docente.curso)}</span></td>
            <td><strong>${escapeHtml(docente.nombre)}</strong></td>
            <td>
                <span class="status-badge ${docente.asistio ? 'presente' : 'ausente'}">
                    ${docente.asistio ? '✅ Presente' : '❌ Ausente'}
                </span>
            </td>
            <td>
                ${docente.asistio && docente.hora ? 
                    `<span class="hora-badge">🕐 ${escapeHtml(docente.hora)}</span>` : 
                    '<span class="hora-badge" style="opacity:0.5;">--:--:--</span>'}
            </td>
            <td>
                <button class="toggle-btn ${docente.asistio ? 'toggle-btn-ausente' : 'toggle-btn-presente'}" 
                        onclick="window.toggleAsistencia(${docente.id})">
                    ${docente.asistio ? 'Marcar Ausente' : 'Marcar Presente'}
                </button>
                <button class="delete-btn" onclick="window.eliminarDocente(${docente.id})">
                    🗑️
                </button>
            </td>
        </table>
    `).join('');
}

function actualizarUI() {
    actualizarEstadisticas();
    renderizarTabla();
    guardarLocal();
}

// ============================================
// FUNCIONES GLOBALES
// ============================================
window.toggleAsistencia = function(id) {
    const docente = docentes.find(d => d.id === id);
    if (docente) {
        const nuevoEstado = !docente.asistio;
        docente.asistio = nuevoEstado;
        
        if (nuevoEstado) {
            // Se marca como presente - registrar hora actual
            docente.hora = obtenerHoraActual();
            docente.fecha = obtenerFechaActual();
        } else {
            // Se marca como ausente - limpiar hora
            docente.hora = "";
            docente.fecha = "";
        }
        
        actualizarUI();
    }
};

window.eliminarDocente = function(id) {
    if (confirm('¿Está seguro de eliminar este docente?')) {
        docentes = docentes.filter(d => d.id !== id);
        actualizarUI();
    }
};

// ============================================
// FUNCIONES CRUD
// ============================================
function agregarDocente() {
    const nombre = document.getElementById('nuevoDocente').value.trim();
    const curso = document.getElementById('cursoDocente').value;
    
    if (!nombre) {
        alert('Por favor ingrese el nombre del docente');
        return;
    }
    if (!curso) {
        alert('Por favor seleccione un curso');
        return;
    }
    if (docentes.some(d => d.nombre.toLowerCase() === nombre.toLowerCase() && d.curso === curso)) {
        alert('Este docente ya está registrado en este curso');
        return;
    }
    
    docentes.push({
        id: Date.now(),
        nombre: nombre,
        curso: curso,
        asistio: false,
        hora: "",
        fecha: ""
    });
    
    document.getElementById('nuevoDocente').value = '';
    actualizarUI();
    alert(`✅ Docente "${nombre}" agregado correctamente al curso ${curso}`);
}

function marcarTodosPresentes() {
    const filtrados = getDocentesFiltrados();
    if (filtrados.length === 0) {
        alert('No hay docentes en el filtro actual');
        return;
    }
    const horaActual = obtenerHoraActual();
    const fechaActual = obtenerFechaActual();
    
    filtrados.forEach(d => {
        d.asistio = true;
        d.hora = horaActual;
        d.fecha = fechaActual;
    });
    actualizarUI();
    alert('✅ Todos los docentes del filtro actual han sido marcados como presentes');
}

function reiniciarTodo() {
    if (confirm('⚠️ ¿Está seguro de eliminar TODOS los docentes? Esta acción no se puede deshacer.')) {
        docentes = [];
        actualizarUI();
        alert('🗑️ Todos los docentes han sido eliminados');
    }
}

// ============================================
// EXPORTAR CSV (incluye hora de ingreso)
// ============================================
function exportarCSV() {
    const datos = getDocentesFiltrados();
    const headers = ['Curso', 'Docente', 'Asistió', 'Hora Ingreso', 'Fecha'];
    const rows = datos.map(d => [
        d.curso, 
        d.nombre, 
        d.asistio ? 'SI' : 'NO',
        d.asistio ? d.hora : '',
        d.asistio ? d.fecha : ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    
    const nombreArchivo = cursoSeleccionado === 'all' 
        ? `asistencia_todos_cursos_${new Date().toISOString().slice(0, 19)}.csv`
        : `asistencia_${cursoSeleccionado}_${new Date().toISOString().slice(0, 19)}.csv`;
    
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✅ Archivo CSV exportado correctamente');
}

// ============================================
// GENERAR PDF (incluye hora de ingreso)
// ============================================
function generarPDF() {
    const hoy = new Date();
    const fecha = hoy.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const hora = hoy.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const datos = getDocentesFiltrados();
    const total = datos.length;
    const presentes = datos.filter(d => d.asistio).length;
    const ausentes = total - presentes;
    const porcentaje = total === 0 ? 0 : Math.round((presentes / total) * 100);
    
    const titulo = cursoSeleccionado === 'all'
        ? 'REPORTE DE ASISTENCIA - TODOS LOS CURSOS'
        : `REPORTE DE ASISTENCIA - ${cursoSeleccionado}`;
    
    let filasTabla = '';
    datos.forEach((docente, index) => {
        filasTabla += `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${escapeHtml(docente.nombre)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${escapeHtml(docente.curso)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; color: ${docente.asistio ? '#28a745' : '#dc3545'}; font-weight: bold;">
                    ${docente.asistio ? '✓ PRESENTE' : '✗ AUSENTE'}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; font-family: monospace;">
                    ${docente.asistio && docente.hora ? docente.hora : '---'}
                </td>
            </tr>
        `;
    });
    
    const htmlPDF = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${titulo}</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; background: white; }
                .encabezado { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e3c72; padding-bottom: 20px; }
                .encabezado h1 { color: #1e3c72; font-size: 24px; margin-bottom: 10px; }
                .encabezado h2 { color: #2a5298; font-size: 18px; margin-bottom: 5px; }
                .fecha { color: #666; font-size: 12px; margin-top: 10px; }
                .resumen { background: #f0f2f5; padding: 20px; margin-bottom: 30px; border-radius: 10px; display: flex; justify-content: space-around; flex-wrap: wrap; }
                .resumen-item { text-align: center; }
                .resumen-item .label { font-size: 12px; color: #666; margin-bottom: 5px; }
                .resumen-item .valor { font-size: 28px; font-weight: bold; color: #1e3c72; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background: #1e3c72; color: white; padding: 12px; text-align: center; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                .firma { margin-top: 50px; display: flex; justify-content: space-between; }
                .firma-linea { text-align: center; width: 45%; }
                .linea { border-top: 1px solid #333; width: 100%; margin-top: 40px; padding-top: 5px; }
                .pie { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 20px; }
                .sin-datos { text-align: center; padding: 40px; color: #999; }
            </style>
        </head>
        <body>
            <div class="encabezado">
                <h1>📋 ${titulo}</h1>
                <h2>Reunión Google Meet - Docentes</h2>
                <div class="fecha">📅 ${fecha} | 🕐 ${hora}</div>
            </div>
            <div class="resumen">
                <div class="resumen-item"><div class="label">👥 TOTAL DOCENTES</div><div class="valor">${total}</div></div>
                <div class="resumen-item"><div class="label">✅ PRESENTES</div><div class="valor" style="color: #28a745;">${presentes}</div></div>
                <div class="resumen-item"><div class="label">❌ AUSENTES</div><div class="valor" style="color: #dc3545;">${ausentes}</div></div>
                <div class="resumen-item"><div class="label">📊 PORCENTAJE</div><div class="valor">${porcentaje}%</div></div>
            </div>
            ${total > 0 ? `
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>NOMBRE DEL DOCENTE</th>
                        <th>CURSO</th>
                        <th style="width: 120px;">ASISTENCIA</th>
                        <th style="width: 100px;">HORA INGRESO</th>
                    </tr>
                </thead>
                <tbody>${filasTabla}</tbody>
            </table>
            ` : '<div class="sin-datos">No hay docentes registrados para esta selección</div>'}
            <div class="firma">
                <div class="firma-linea"><div class="linea"></div><div style="font-size: 11px; margin-top: 5px;">Firma del Responsable</div></div>
                <div class="firma-linea"><div class="linea"></div><div style="font-size: 11px; margin-top: 5px;">Sello de la Institución</div></div>
            </div>
            <div class="pie">Documento generado automáticamente - Sistema de Control de Asistencia<br>Fecha de emisión: ${fecha} a las ${hora}</div>
        </body>
        </html>
    `;
    
    const ventanaPDF = window.open('', '_blank');
    ventanaPDF.document.write(htmlPDF);
    ventanaPDF.document.close();
    
    setTimeout(() => ventanaPDF.print(), 500);
    alert('✅ Se ha abierto una nueva ventana con el reporte.\n\nPara guardar como PDF:\n1. Presione Ctrl+P (Windows) o Cmd+P (Mac)\n2. Seleccione "Guardar como PDF"');
}

// ============================================
// CARGAR DESDE GOOGLE SHEETS
// ============================================
async function cargarDesdeGoogleSheets() {
    const statusDiv = document.getElementById('connectionStatus');
    statusDiv.innerHTML = '📥 Cargando datos desde Google Sheets...';
    statusDiv.className = 'connection-status';
    
    try {
        const response = await fetch(HOJA_CSV_URL);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const csvText = await response.text();
        
        const nuevosDocentes = [];
        let idCounter = Date.now();
        const lineas = csvText.split(/\r?\n/);
        let esPrimeraLinea = true;
        let cursosEncontrados = new Set();
        
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            if (!linea) continue;
            
            let partes = [];
            let enComillas = false;
            let actual = '';
            
            for (let j = 0; j < linea.length; j++) {
                const char = linea[j];
                if (char === '"') {
                    enComillas = !enComillas;
                } else if (char === ',' && !enComillas) {
                    partes.push(actual.trim());
                    actual = '';
                } else {
                    actual += char;
                }
            }
            partes.push(actual.trim());
            partes = partes.map(p => p.replace(/^["']|["']$/g, ''));
            
            if (esPrimeraLinea) {
                esPrimeraLinea = false;
                if (partes[0] && (partes[0].toLowerCase() === 'curso' || 
                    partes[0].toLowerCase() === 'docente')) {
                    continue;
                }
            }
            
            let curso = partes[0] || '';
            let nombre = partes[1] || '';
            let asistioText = partes[2] || '';
            let hora = partes[3] || '';
            let fecha = partes[4] || '';
            
            if (nombre) {
                let asistio = asistioText.toLowerCase() === 'si' || 
                              asistioText.toLowerCase() === 'sí' || 
                              asistioText.toLowerCase() === 'presente' ||
                              asistioText.toLowerCase() === 'true' ||
                              asistioText === '1';
                
                if (curso) cursosEncontrados.add(curso);
                
                nuevosDocentes.push({
                    id: idCounter++,
                    nombre: nombre,
                    curso: curso || "SIN CURSO",
                    asistio: asistio,
                    hora: asistio ? hora : "",
                    fecha: asistio ? fecha : ""
                });
            }
        }
        
        if (nuevosDocentes.length > 0) {
            docentes = nuevosDocentes;
            cursosDisponibles = [...cursosEncontrados].sort();
            actualizarSelectsCursos();
            actualizarUI();
            statusDiv.innerHTML = `✅ Conectado correctamente. Cargados ${docentes.length} docentes desde ${cursosDisponibles.length} cursos`;
            statusDiv.className = 'connection-status connected';
        } else {
            statusDiv.innerHTML = '⚠️ No se encontraron datos. Usando datos de respaldo.';
            statusDiv.className = 'connection-status error';
            cargarLocalRespaldo();
        }
        
    } catch (error) {
        console.error('Error:', error);
        statusDiv.innerHTML = `⚠️ Error de conexión. Usando datos locales.`;
        statusDiv.className = 'connection-status error';
        cargarLocalRespaldo();
    }
}

// ============================================
// ACTUALIZAR SELECTS DE CURSOS
// ============================================
function actualizarSelectsCursos() {
    const filtroSelect = document.getElementById('cursoFiltro');
    filtroSelect.innerHTML = '<option value="all">📋 TODOS LOS CURSOS</option>';
    cursosDisponibles.forEach(curso => {
        filtroSelect.innerHTML += `<option value="${curso}">📚 ${curso}</option>`;
    });
    
    const addSelect = document.getElementById('cursoDocente');
    addSelect.innerHTML = '<option value="">Seleccionar curso...</option>';
    cursosDisponibles.forEach(curso => {
        addSelect.innerHTML += `<option value="${curso}">${curso}</option>`;
    });
}

// ============================================
// INICIALIZAR SELECTS
// ============================================
function inicializarSelects() {
    const filtroSelect = document.getElementById('cursoFiltro');
    filtroSelect.innerHTML = '<option value="all">📋 TODOS LOS CURSOS</option>';
    filtroSelect.addEventListener('change', (e) => {
        cursoSeleccionado = e.target.value;
        actualizarUI();
    });
}

// ============================================
// INICIALIZAR EVENTOS
// ============================================
function inicializarEventos() {
    document.getElementById('btnAgregarDocente').addEventListener('click', agregarDocente);
    document.getElementById('btnMarcarTodosPresentes').addEventListener('click', marcarTodosPresentes);
    document.getElementById('btnExportarCSV').addEventListener('click', exportarCSV);
    document.getElementById('btnGenerarPDF').addEventListener('click', generarPDF);
    document.getElementById('btnReiniciar').addEventListener('click', reiniciarTodo);
    document.getElementById('btnAgregar').addEventListener('click', agregarDocente);
    
    document.getElementById('nuevoDocente').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') agregarDocente();
    });
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        busquedaActual = e.target.value;
        renderizarTabla();
    });
}

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================
async function init() {
    inicializarSelects();
    inicializarEventos();
    await cargarDesdeGoogleSheets();
}

document.addEventListener('DOMContentLoaded', init);