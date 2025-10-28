let memory = new Memoria();
let programs = [];

// Agregar un programa a la lista de programas
function addProgram() {
  const nomPrograma = document.getElementById("nomPrograma").value;
  const textPrograma = parseInt(document.getElementById("tamPrograma").value, 10);
  const dataPrograma = parseInt(document.getElementById("dataPrograma").value, 10);
  const bssPrograma = parseInt(document.getElementById("bssPrograma").value, 10);
  if (nomPrograma.trim() === "" || isNaN(textPrograma) || textPrograma <= 0 || isNaN(dataPrograma) || dataPrograma <= 0 || isNaN(bssPrograma) || dataPrograma <= 0)
    return;

  document.getElementById("nomPrograma").value = "";
  document.getElementById("tamPrograma").value = "";
  document.getElementById("dataPrograma").value = "";
  document.getElementById("bssPrograma").value = "";
  programs.push(new Programa(nomPrograma, textPrograma, dataPrograma, bssPrograma));
  actualizarProgramas();
}

function actualizarProgramas() {
  let programList = document.querySelector("#programList tbody");
  programList.innerHTML = "";
  programs.map((p) => {
    let tr = document.createElement('tr');
    tr.className = 'program';
    tr.innerHTML =
      `
      <td>${p.nombre}</td><td>${(p.text)}</td><td>${(p.data)}</td><td>${(p.bss)}</td><td><a href='#'>Ejecutar</a></td>
      `
    tr.querySelector('a').onclick = (e) => {
      e.preventDefault()
      runProgram(p)
    }
    programList.appendChild(tr);
  });
}

// Ejecutar un programa
function runProgram(programa) {
  try {
    memory.ejecutarPrograma(programa);
    actualizarGrafico();
  } catch (error) {
    alert('No se puede ejecutar el programa,la memoria está llena')

  }
}
// Detener un programa en ejecución
function stopProgram(e) {
  e.preventDefault();
  let ind = parseInt(e.target.dataset.ind);
  memory.terminarPrograma(ind);
  actualizarGrafico();
  dibujarDivisiones();
}

function dibujarDivisiones(ind) {
  
  let cabecera = document.querySelector("#t-seg-head");
  let body = document.querySelector("#segments");
  let proenej = document.querySelector("#programa-en-ejecucion");
  if(memory.procesos[ind]){
  proenej.textContent=`${memory.procesos[ind].programa.nombre}`;
  
  body.innerHTML = ''
  if (memory.metodoMem == 'p') {
    cabecera.innerHTML = `
        <tr>
          <th colspan='2'>Página</th>
          <th colspan='2'>Marco</th>
          <th rowspan="2">Presente</th>
        </tr>
        <tr>
          <th id="parameters">Hex</th>
          <th id="parameters">Dec</th>
          <th id="parameters">Hex</th>
          <th id="parameters">Dec</th>
        </tr>
      `
    for (let segmento of memory.procesos[ind].segmentos) {
      let tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${segmento.numPag.toString(16)}</td>
        <td>${segmento.numPag}</td>
        <td>${(segmento.marco + 1).toString(16)}</td>
        <td>${segmento.marco + 1}</td>
        <td>${segmento.presente}</td>
      `
      body.appendChild(tr)
    }
  }
  else {
    cabecera.innerHTML = `
      <tr>
        <th colspan='2'>Numero</th>
        <th colspan='2'>Base</th>
        <th colspan='2'>Limite</th>
        <th rowspan="2">Permisos</th>
      </tr>
      <tr>
        <th id="parameters">Hex</th>
        <th id="parameters">Dec</th>
        <th id="parameters">Hex</th>
        <th id="parameters">Dec</th>
        <th id="parameters">Hex</th>
        <th id="parameters">Dec</th>
      </tr>`
    for (let segmento of memory.procesos[ind].segmentos) {
      let tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${segmento.numSeg.toString(16)}</td>
        <td>${segmento.numSeg}</td>
        <td>${segmento.base.toString(16)}</td>
        <td>${segmento.base}</td>
        <td>${segmento.limite.toString(16)}</td>
        <td>${segmento.limite}</td>
        <td>${segmento.permisos}</td>
      `
      body.appendChild(tr)
    }
  }
  }else{
    proenej.textContent="";
    if (memory.metodoMem == 'p') {
    body.innerHTML=``;
    cabecera.innerHTML = `
        <tr>
          <th colspan='2'>Página</th>
          <th colspan='2'>Marco</th>
          <th rowspan="2">Presente</th>
        </tr>
        <tr>
          <th id="parameters">Hex</th>
          <th id="parameters">Dec</th>
          <th id="parameters">Hex</th>
          <th id="parameters">Dec</th>
        </tr>
      `;
  }
  else {
    cabecera.innerHTML = `
      <tr>
        <th colspan='2'>Numero</th>
        <th colspan='2'>Base</th>
        <th colspan='2'>Limite</th>
        <th rowspan="2">Permisos</th>
      </tr>
      <tr>
        <th id="parameters">Hex</th>
        <th id="parameters">Dec</th>
        <th id="parameters">Hex</th>
        <th id="parameters">Dec</th>
        <th id="parameters">Hex</th>
        <th id="parameters">Dec</th>
      </tr>`;
    body.innerHTML = ``;
    
  }
  }
}
function selectProgram(e) {
  e.preventDefault();
  let ind = parseInt(e.target.parentElement.dataset.ind);
  dibujarDivisiones(ind)
}

function actualizarGrafico() {
  let tablaEjecucion = document.querySelector('#t-ejecucion tbody')
  tablaEjecucion.innerHTML = ''
  let grafico = document.querySelector('#grafico tbody');
  grafico.innerHTML = '';
  let maxWidth = document.querySelector('.memory-container').offsetHeight;


  function caclPixeles(tamano) {
    return maxWidth * tamano / memory.tamanoMem;
  }

  function dibujarSegmentacion() {
     // Determinar color de fondo: verde si está libre, blanco si está ocupado
    let bgColor = (part.proceso == null) ? "lightgreen" : "white";
    let dirFinal = part.dirInicio + part.tamano - 1;
    let contenido =
      `<tr>
          <td>${part.dirInicio.toString(16)}</td>
          <td>${part.dirInicio}</td>
          <td rowspan="2" style="height: ${caclPixeles(part.tamano)}px; background-color: ${bgColor};">`;
    if (part.proceso != null) {
      if (typeof (part.proceso) == 'string') {
        nombre = 'SO';
        id = 1;
      }
      else {
        nombre = part.proceso.programa.nombre
        id = part.proceso.id
      }
      
      contenido += `(${id}) ${nombre} ${part.tipo ? ' - .' + part.tipo : ''}`;
      
    }else{
      contenido += `Libre:  ${Math.abs(dirFinal-part.dirInicio)}`;
      
    }
    contenido +=
      `  </td>
      </tr>
      <tr>
        <td>${dirFinal.toString(16)}</td>
        <td>${dirFinal}</td>
      </tr>`;
    grafico.innerHTML += contenido;
    i++;
  }

  function dibujarPaginacion() {
    let bgColor = (part.proceso == null) ? "lightgreen" : "white";
    let dirFinal = part.dirInicio + part.tamano - 1;
    let contenido =
      `<tr>
          <td>${i + 1}</td>
          <td>${part.dirInicio.toString(16)}</td>
          <td style="height: ${caclPixeles(part.tamano)}px; background-color: ${bgColor};">`;
    if (part.proceso != null) {
      if (typeof (part.proceso) == 'string') {
        nombre = 'SO';
        id = 1;
      }
      else {
        nombre = part.proceso.programa.nombre
        id = part.proceso.id
      }
      contenido += `(${id}) ${nombre} ${part.tipo ? ' - .' + part.tipo : ''}`;
    }else{
      contenido += `Libre: ${Math.abs(dirFinal-part.dirInicio)}`;
    }
    contenido +=
      `  </td>
      </tr>`;
    grafico.innerHTML += contenido;
    i++;
  }

  let i = 0;
  let dibujar;
  let title1 = document.querySelector('#t1');
  let title2 = document.querySelector('#t2');
  if (memory.metodoMem == 's') {
    dibujar = dibujarSegmentacion;
    title1.textContent = 'Dir hex'
    title2.textContent = 'Dir dec'
  }
  else {
    dibujar = dibujarPaginacion;
    title1.textContent = 'Marco'
    title2.textContent = 'Hex'
  }

  for (part of memory.particiones) {
    dibujar();
  }

  tablaEjecucion.innerHTML +=
    `<tr>
          <td>1</td>
          <td>SO</td>
          <td>${memory.tamSo}</td>
          <td></td>
        </tr>`
  for (let i = 0; i < memory.procesos.length; i++) {
    let proceso = memory.procesos[i];
    tablaEjecucion.innerHTML +=
      `<tr data-ind='${i}' onclick='selectProgram(event)'>
          <td>${proceso.id}</td>
          <td>${proceso.programa.nombre}</td>
          <td>${proceso.programa.tamano}</td>
          <td><a href='#' data-ind='${i}' onclick='stopProgram(event)'>Finalizar</a></td>
      </tr>
    `
  }

}
function actualizarTablaSegmentacion() {
  const selectTam = document.getElementById("tamSeg");
  const valorSeleccionado = parseInt(selectTam.value);

  // Calcula los parámetros
  const maxNumSegs = 2 ** valorSeleccionado;
  const maxOffset = 2 ** (24 - valorSeleccionado);

  // Actualiza la tabla
  document.getElementById("numSegmentos").textContent = maxNumSegs;
  document.getElementById("offsetMax").textContent = maxOffset;
}

function inicializar() {

  // document.querySelector('#algoritmo').onchange = (e) => {
  //   memory.setAjuste(e.target.value)
  // }
document.querySelector('#tipo_memoria').onchange = (e) => {
  const valor = e.target.value;

  // Cambiar método de gestión de memoria
  memory.setMetodoGestion(valor);

  // Actualizar gráfico de memoria
  actualizarGrafico();

  // Mostrar/ocultar parámetros de segmentación
  const segInfoDiv = document.querySelector(".seg-info");
  if (valor === "segmentacion") {
    segInfoDiv.style.display = "block";
  } else {
    segInfoDiv.style.display = "none";
  }
  dibujarDivisiones();
};
  document.getElementById("tamSeg").addEventListener("change", () => {
    actualizarTablaSegmentacion();
    MetodoSegmentacion.actualizarParametrosDesdeSelect();
    memory.resetMemory(); // reinicia memoria con nuevos valores
    actualizarGrafico();
  });

  programs = [
    new Programa("Notepad", 19524, 12352, 1165),
    new Programa("Word", 77539, 32680, 4100),
    new Programa("Excel", 99542, 24245, 7557),
    new Programa("AutoCAD", 115000, 123470, 1123),
    new Programa("Calculadora", 12342, 1256, 1756),
    new Programa("p1", 525000, 3224000, 51000),
    new Programa("p2", 590000, 974000, 25000),
    new Programa("p3", 349000, 2150000, 1000),
  ]
  actualizarProgramas();
  actualizarGrafico();
}

inicializar()