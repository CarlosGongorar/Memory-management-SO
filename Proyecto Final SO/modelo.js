class Bloqueo {
  constructor(inicio, duracion) {
    this.inicio = inicio;
    this.duracion = duracion;
  }
}

class Programa {
  constructor(nombre, instanteLlegada, duracion, bloqueos = []) {
    this.nombre = nombre;
    this.instanteLlegada = instanteLlegada;
    this.duracion = duracion;
    this.bloqueos = bloqueos;
  }
}

class Proceso {
  constructor(id, programa) {
    this.id = id;
    this.programa = programa;
    this.ejecucion = []; // Estado en cada instante de ejecución
    this.tiempoEjecutado = 0; // Tiempo total de ejecución
    this.bloqRegs = [];
    this.terminado = false;
    this.estadisticas = {
      retorno: 0,
      tiempoPerdido: 0,
      tiempoEspera: 0,
      penalidad: 0,
      tiempoRespuesta: 0
    }
  }
}

class SO {
  #contextAlg;

  constructor() {
    this.ultimoPid = 1;
    this.procesos = [];
    this.despachador = new Proceso(0, new Programa('despachador'))
    this.#contextAlg = new ContextoAlgoritmo();
  }

  agregarProceso(programa) {
    this.procesos.push(new Proceso(this.ultimoPid++, programa))
  }

  eliminarProceso(ind) {
    this.procesos.slice(ind, 1)
  }

  setAlg(algoritmo, quantum = null) {
    //TODO cambiar por algoritmos
    if (algoritmo == 'FCFS') {
      this.#contextAlg.cambiarAlgoritmo(new FirstCome());
    }
    else if (algoritmo == 'SJF') {
      this.#contextAlg.cambiarAlgoritmo(new ShortestJob());
    }
    else if (algoritmo == 'SRTF') {
      this.#contextAlg.cambiarAlgoritmo(new ShortReamingTime());
    }
    else if (algoritmo == 'RR') {
      this.#contextAlg.cambiarAlgoritmo(new RoundRobin(quantum));
    }
  }
  ejecutarProgramas() {
    // 1. REINICIO
    let terminados = 0;
    this.procesos.forEach(p => {
        p.ejecucion = [];
        p.tiempoEjecutado = 0;
        p.terminado = false;
        p.tiempoRestanteBloqueo = 0;
    });

    // Limpiar despachador
    if (this.despachador) this.despachador.ejecucion = [];

    this.procesos.sort((a, b) => a.programa.instanteLlegada - b.programa.instanteLlegada);
    if (this.procesos.length === 0) return;

    let instante = 0; 
    let its = 0;
    const LIMITE = 3000;

    // === BUCLE PRINCIPAL ===
    while (terminados < this.procesos.length && its < LIMITE) {
      
      // A. Filtro Candidatos
      let candidatos = this.procesos.filter(p => 
          !p.terminado && 
          p.programa.instanteLlegada <= instante &&
          p.tiempoRestanteBloqueo === 0
      );

      // B. Selección
      let ganador = null;
      let esOverhead = false; // Bandera exclusiva para Round Robin

      if (candidatos.length > 0) {
          ganador = this.#contextAlg.sigProceso(candidatos, instante);
          
          // Detectar señal de Round Robin
          if (ganador === 'despachador') {
              esOverhead = true; // ¡Solo esto activará el color verde!
              ganador = null; 
          }
      }

      // C. Escritura de Estados
      for (let p of this.procesos) {
          if (instante < p.programa.instanteLlegada) {
              p.ejecucion.push('404');
          }
          else if (p.terminado) {
              p.ejecucion.push('terminado');
          }
          else if (p.tiempoRestanteBloqueo > 0) {
              p.ejecucion.push('bloqueado');
              p.tiempoRestanteBloqueo--;
          }
          else if (p === ganador) { 
              p.ejecucion.push('ejecutando');
              p.tiempoEjecutado++;

              if (p.tiempoEjecutado >= p.programa.duracion) {
                  p.terminado = true;
                  terminados++;
              } else {
                  for (let bloq of p.programa.bloqueos) {
                      if (bloq.inicio === p.tiempoEjecutado) {
                          p.tiempoRestanteBloqueo = bloq.duracion;
                      }
                  }
              }
          }
          else {
              p.ejecucion.push('espera');
          }
      }

      // D. GESTIÓN DEL DESPACHADOR (CORREGIDO)
      if (this.despachador) {
          // Solo pintamos verde si es Overhead EXPLÍCITO (Round Robin)
          if (esOverhead) {
              this.despachador.ejecucion.push('ejecutando');
          } else {
              // En cualquier otro caso (FCFS, SJF, SRTF o CPU vacía), se queda en blanco
              this.despachador.ejecucion.push('');
          }
      }

      instante++;
      its++;
    }
    
    this.procesos.sort((a, b) => a.id - b.id);
  }
 

  calcEstadisticas(){
    for (let proceso of this.procesos) {
      let t0 = 0;
      let tf = -1;
      let esTRespuesta = true;
      let i;
      for(i=0; i<proceso.ejecucion.length; i++ ){
        let instante = proceso.ejecucion[i]
        if(instante == '404'){
          t0++;
        }
        if(instante == 'espera'){
          proceso.estadisticas.tiempoEspera++;
          if(esTRespuesta){
             proceso.estadisticas.tiempoRespuesta++;
          }
        }
        if(instante == 'ejecutando'){
          esTRespuesta = false;
          tf = i+1;
        }
        // if(instante == 'terminado' && tf == -1){
        //   tf = i;
        // }
      }
      //proceso.estatisticas.retorno es igual al indice del ultimo 'ejectuando' en ejecucion
      proceso.estadisticas.retorno = tf-t0;
      proceso.estadisticas.tiempoPerdido = proceso.estadisticas.retorno-proceso.programa.duracion;
      if (proceso.tiempoPerdido < proceso.tiempoEspera){
        proceso.estadisticas.tiempoPerdido = proceso.estadisticas.tiempoEspera;
      }
      proceso.estadisticas.penalidad = proceso.estadisticas.retorno/proceso.programa.duracion;
    }
  }
}

//rellena los espacios sin definir
function fillSinOverW(arr, value, inplace = true, start = 0, end = arr.length) {
  let newArr;
  if (inplace) {
    newArr = arr;
  }
  else {
    newArr = [...arr]
  }
  for (let i = start; i < end; i++) {
    if (typeof newArr[i] === 'undefined') {
      newArr[i] = value;
    }
  }
  return arr;
}
