//de modelo.js
let so = new SO();
let programs = [];

// Agregar un programa a la lista de programas
function addProgram() {
  const nomPrograma = document.getElementById("nomPrograma").value;
  //check that the programn name is not empty and its unique from the other programs
  if (programs.find((p) => p.nombre == nomPrograma)) {
    alert("Programa ya existe");
    return;
  }
  const instantellegadaPrograma = parseInt(
    document.getElementById("instantellegadaPrograma").value,
    10
  );
  const ejecucionPrograma = parseInt(
    document.getElementById("ejecucionPrograma").value,
    10
  );
  if (nomPrograma == "" || isNaN(instantellegadaPrograma) || isNaN(ejecucionPrograma)) {
    alert("Programa invalido");
    return;
  }
  const iniciobPrograma = document.getElementById("iniciobPrograma").value;
  const duracionbPrograma = document.getElementById("duracionbPrograma").value;
  let sinBloqueos = false;
  if (iniciobPrograma == "" && duracionbPrograma == "") {
    sinBloqueos = true;
  }else if (iniciobPrograma == "" || duracionbPrograma == "") {
    alert("bloqueos invalidos");
    return;
  }
  let iniciosBloq = sinBloqueos ? [] : iniciobPrograma.split(",").map((e) => parseInt(e));
  if (!sinBloqueos && iniciosBloq[0] >= ejecucionPrograma) {
    alert("El inicio del bloqueo no puede ser mayor ni igual a la duracion del programa");
    return;
  }
  let durBloqs = sinBloqueos ? [] : duracionbPrograma.split(",").map((e) => parseInt(e));
  let bloqs = [];
  console.log(iniciosBloq.length, durBloqs.length);
  if (iniciosBloq.length == durBloqs.length) {
    for (let i = 0; i < iniciosBloq.length; i++) {
      if (iniciosBloq[i] <= 0 || isNaN(iniciosBloq[i] ) || durBloqs[i] <= 0 || isNaN(durBloqs[i])) {
        alert("Los bloqueos deben ser numeros mayores a 0");
        return;
      }
      bloqs.push(new Bloqueo(iniciosBloq[i], durBloqs[i]));
    }
  } else {
    alert("bloqueos invalidos");
    return;
  }
  document.getElementById("nomPrograma").value = "";
  document.getElementById("instantellegadaPrograma").value = "";
  document.getElementById("ejecucionPrograma").value = "";
  document.getElementById("iniciobPrograma").value = "";
  document.getElementById("duracionbPrograma").value = "";
  if (bloqs.length == 0) {
    programs.push(
      new Programa(nomPrograma, instantellegadaPrograma, ejecucionPrograma)
    );
  } else {
    programs.push(
      new Programa(
        nomPrograma,
        instantellegadaPrograma,
        ejecucionPrograma,
        bloqs
      )
    );
  }
  actualizarProgramas();
}

function actualizarProgramas() {
  let programList = document.querySelector("#programList tbody");
  programList.innerHTML = "";
  programs.map((p, index) => {
    let tr = document.createElement("tr");
    tr.className = "program";
    tr.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.instanteLlegada}</td>
      <td>${p.duracion}</td>
    `;
    let locks = "";
    p.bloqueos.map((b) => {
      locks += `[i: ${b.inicio} d: ${b.duracion}] `;
    });
    tr.innerHTML += `<td>${locks}</td>
      <td><button onclick="eliminarPrograma(${index})">Terminar</button></td>
      `;
    programList.appendChild(tr);
  });
}

// Eliminar un programa de la lista de programas
function eliminarPrograma(index) {
  programs.splice(index, 1);
  actualizarProgramas();
}

// Detener un programa en ejecución
function stopProgram(e) {
  e.preventDefault();
}

function startSimulation() {
  so = new SO();
  programs.forEach((p) => {
    so.agregarProceso(p);
  });
  const algSelect = document.querySelector("#algoritmo");
  let quantum;
  if (algSelect.value == "RR") {
    quantum = parseInt(document.querySelector("#quantum").value);
    if (isNaN(quantum) || quantum == 0) {
      alert("Quantum invalido"); //Note emergent
      return;
    }
  }
  so.setAlg(algSelect.value, quantum);
  so.ejecutarProgramas();
  so.calcEstadisticas();
  console.log(so);
  actualizarGrafico();
}

function actualizarGrafico() {
  let graph = document.querySelector("#grafico tbody");
  const statsTable = document.querySelector("#t-stats tbody");
  statsTable.innerHTML = "";
  graph.innerHTML = "";
  let time = 0;
  for (let process of so.procesos) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<th>${process.id}. - ${process.programa.nombre}</th>`;
    process.ejecucion.forEach((instant) => {
      let classTd = "";
      if (instant == "404" || instant == "terminado") {
        classTd = "";
      } else if (instant == "espera") {
        classTd = "waiting";
      } else if (instant == "ejecutando") {
        classTd = "execute";
      } else if (instant == "bloqueado") {
        classTd = "locked";
      } else {
        console.log("llamen a dios");
        return;
      }
      tr.innerHTML += `<td class="${classTd}" />`;
    });
    graph.appendChild(tr);

    const statsTr = document.createElement("tr");
    statsTr.innerHTML = `<td>${process.programa.nombre}</td>
      <td>${process.estadisticas.retorno}</td>
      <td>${process.estadisticas.tiempoPerdido}</td>
      <td>${process.estadisticas.tiempoEspera}</td>
      <td>${process.estadisticas.penalidad.toFixed(3)}</td>
      <td>${process.estadisticas.tiempoRespuesta}</td>`;

    statsTable.appendChild(statsTr);
  }
  const trDisp = document.createElement("tr");
  trDisp.innerHTML = "<th>Despachador</th>";
  so.despachador.ejecucion.forEach((instant) => {
    let classTd = instant == "ejecutando" ? "execute" : "";
    trDisp.innerHTML += `<td class="${classTd}" />`;
  });
  graph.appendChild(trDisp);
  const trInfo = document.createElement("tr");
  trInfo.innerHTML = "<th>programas</th>";
  for (let i = 1; i <= so.procesos[0].ejecucion.length; i++) {
    trInfo.innerHTML += `<td>t<sub>${i}</sub></td>`;
  }
  graph.appendChild(trInfo);
}

function inicializar() {
  document.querySelector("#algoritmo").onchange = (e) => {
    so.setAlg(e.target.value);
  };
 programs = [
    new Programa("A", 0, 6, [new Bloqueo(3, 2)]),
    new Programa("B", 1, 8, [new Bloqueo(1, 3)]),
    new Programa("C", 2, 7, [new Bloqueo(5, 1)]),
    new Programa("D", 4, 3),
    new Programa("E", 6, 9, [new Bloqueo(2, 4)]),
    new Programa("F", 6, 2),
  ];
  actualizarProgramas();
}

inicializar();

// === Ocultar/Mostrar input de Quantum dinámicamente ===

const selectAlgoritmo = document.getElementById('algoritmo');
const inputQuantum = document.getElementById('quantum');

// 1. Escuchar cambios en el selector
selectAlgoritmo.addEventListener('change', function() {
    toggleQuantum();
});

// 2. Función para mostrar u ocultar
function toggleQuantum() {
    if (selectAlgoritmo.value === 'RR') {
        inputQuantum.style.display = 'inline-block'; // Mostrar
        inputQuantum.focus(); // Poner el cursor ahí
    } else {
        inputQuantum.style.display = 'none'; // Ocultar
        inputQuantum.value = ''; // Limpiar valor
    }
}

// 3. Ejecutar al inicio por si acaso
toggleQuantum();