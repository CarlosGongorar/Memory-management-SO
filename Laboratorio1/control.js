let memory = new Memoria();
let programs = [];

// Agregar un programa a la lista de programas
function addProgram() {
  const nomPrograma = document.getElementById("nomPrograma").value;
  const tamPrograma = parseInt(document.getElementById("tamPrograma").value, 10)*1024;
  if (nomPrograma.trim() === "" || isNaN(tamPrograma) || tamPrograma <= 0)
    return;

  document.getElementById("nomPrograma").value = "";
  document.getElementById("tamPrograma").value = "";
  programs.push(new Programa(nomPrograma, tamPrograma));
  actualizarProgramas();
}

function actualizarProgramas(){
  let programList = document.querySelector("#programList tbody");
  programList.innerHTML = "";
  programs.map((p) => {
    let tr = document.createElement('tr');
    tr.className = 'program';
    tr.innerHTML = 
      `
      <td>${p.nombre}</td><td>${(p.tamano/1024).toFixed(2)}</td><td><a href='#'>Ejecutar</a></td>
      `
    tr.querySelector('a').onclick = (e) => {
      e.preventDefault()
      runProgram(p)
    }
    programList.appendChild(tr);
  });

  //prueba ocupado / libre
  let libre = document.getElementById('libre');
  libre.textContent = "hola";
}

// Ejecutar un programa
function runProgram(programa) {
  memory.ejecutarPrograma(programa);
  actualizarGrafico();
}

// Detener un programa en ejecución
function stopProgram(e) {
  e.preventDefault();
  let ind = parseInt(e.target.dataset.ind);
  memory.terminarPrograma(ind);
  actualizarGrafico();
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

  let i = 0;
  for (part of memory.particiones) {
    
    let dirFinal = part.dirInicio + part.tamano-1;
    let contenido =
      `<tr>
          <td>${part.dirInicio.toString(16)}</td>
          <td>${part.dirInicio}</td>
          <td rowspan="2" style="height: ${caclPixeles(part.tamano)}px;">`;
    if (part.proceso != null) {
      if (typeof (part.proceso) == 'string') {
        nombre = 'SO';
        id = 1;
      }
      else {
        nombre = part.proceso.programa.nombre
        id = part.proceso.id
      }
      contenido += `${nombre} - (PID: ${id})`;
      tablaEjecucion.innerHTML += 
        `<tr>
          <td>${id}</td>
          <td>${nombre}</td>
          <td>${part.dirInicio.toString(16)}</td>
          <td>${part.dirInicio}</td>
          <td>${part.tamano}</td>
          <td><a href='#' data-ind='${i}' onclick='stopProgram(event)'>Finalizar</a></td>
        </tr>
        `
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
}

function inicializar(){

  document.querySelector('#algoritmo').onchange = (e)=>{
    memory.setAjuste(e.target.value)
  }
  document.querySelector('#tipo_memoria').onchange = (e)=>{
    memory.setMetodoGestion(e.target.value)
    actualizarGrafico()
  }
  
  programs = [
    new Programa("Notepad", 224649),
    new Programa("Word", 286708),
    new Programa("Excel", 309150),
    new Programa("AutoCAD", 436201),
    new Programa("Calculadora", 209462),
    new Programa("p1", 3996608),
    new Programa("p2", 1785608),
    new Programa("p3", 2696608),
  ]
  actualizarProgramas();
  actualizarGrafico();
}

inicializar()