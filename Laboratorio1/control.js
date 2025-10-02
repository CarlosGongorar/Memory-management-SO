  let select = document.getElementById("tamPart");
  let value = +select.value; // Obtiene el value
  console.log(value);
  
let memory = new Memoria(value,16777216);
let programs = [];

let memoryAv=16777216;
let tipoGest="estatic-fijo";

// Agregar un programa a la lista de programas
function addProgram() {
  const nomPrograma = document.getElementById("nomPrograma").value;
  const tamPrograma = parseInt(document.getElementById("tamPrograma").value, 10)*1024;
  if (nomPrograma.trim() === "" || isNaN(tamPrograma) || tamPrograma <= 0){
return;
//ingrese nombre
  }
    
  document.getElementById("nomPrograma").value = "";
  document.getElementById("tamPrograma").value = "";
  programs.push(new Programa(nomPrograma, tamPrograma));
  actualizarProgramas();
}

function actualizarMemoryState(min) {
  if(tipoGest==="estatic-fijo"){
    if(min<0){
    min=-memory.particiones[0].tamano;
    }else if(min<=memory.particiones[0].tamano){
      min=memory.particiones[0].tamano;
    }
    //console.log(min);
  }
  
  memoryAv-=min;
  //console.log(memoryAv);
  
  let ocupado = 16777216 - memoryAv; // Memoria usada
  //console.log("ocupado " , ocupado);
  
  let libre = memoryAv;    
  document.getElementById('ocupado').textContent = ocupado + " Bytes";
  document.getElementById('libre').textContent = libre + " Bytes";
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

}

// Ejecutar un programa
function runProgram(programa) {
  flag=memory.ejecutarPrograma(programa);
  if(flag){
    actualizarMemoryState(programa.tamano);
  }
  
  actualizarGrafico();
}

// Detener un programa en ejecución
function stopProgram(e) {
  e.preventDefault();
  let ind = parseInt(e.target.dataset.ind);
  if(ind==0){
    return;
  }
  //console.log(memory.obtenerPrograma(ind).programa);
  actualizarMemoryState(-memory.obtenerPrograma(ind).programa.tamano);
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
    
    let tipo = e.target.value;
    tipoGest = tipo;
    //console.log(tipoGest);
    
  // Mostrar u ocultar lista de tamaños según selección
  let contenedor = document.getElementById("tamPartContainer");

  let contenedorAlg = document.getElementById("selectAlgtContainer");
  if (tipo === "estatic-fijo") {
    contenedor.style.display = "block";
    contenedorAlg.style.display = "none";
  }else if(tipo === "dinamic-con"){
    contenedorAlg.style.display = "none";
  } else {
    contenedor.style.display = "none";
    contenedorAlg.style.display = "block";
  }
    memory = new Memoria(value, 16777216);
    memoryAv=16777216;
    actualizarMemoryState(memory.particiones[0].tamano);
    memory.setMetodoGestion(e.target.value)
    actualizarGrafico()
  }
  // 👇 Manejar cambio de tamaño de particiones
  document.querySelector('#tamPart').onchange = (e) => {
    let value = +e.target.value; // Obtiene el valor en número
    console.log("Nuevo tamaño de partición:", value);

    // Reinicializar memoria y limpiar programas
    memory = new Memoria(value, 16777216);
    memoryAv=16777216;
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
  actualizarMemoryState(memory.particiones[0].tamano);
  actualizarProgramas();
  actualizarGrafico();
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
  actualizarMemoryState(memory.particiones[0].tamano);
  actualizarProgramas();
  actualizarGrafico();
}

inicializar()