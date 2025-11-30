class ContextoAlgoritmo {
  #estadoAlgoritmo = null;
  constructor(algInicial = new RoundRobin(2)) {
    this.#estadoAlgoritmo = algInicial;
  }

  cambiarAlgoritmo(algoritmo) {
    this.#estadoAlgoritmo = algoritmo;
  }

  sigProceso(procesos, instante) {
    return this.#estadoAlgoritmo.sigProceso(procesos, instante);
  }

  asignarEjecucion(proceso) {
    return this.#estadoAlgoritmo.asignarEjecucion(proceso);
  }
}

class Algoritmo {
  constructor() {
    if (this.constructor == Algoritmo) {
      throw new Error("Abstract classes can't be instantiated.");
    }
  }

  sigProceso(procesos) {
    throw new Error("Method 'encontrarPart(...)' must be implemented.");
  }

  asignarEjecucion(proceso) {
    throw new Error("Method 'asignarEjecucion(...)' must be implemented.");
  }
}

class FirstCome extends Algoritmo {

  constructor() {
    super()
  }

  sigProceso(procesos, instante) {
    if (procesos.length === 0) return null;

    // 1. LÓGICA DE CONTINUIDAD (NO EXPROPIATIVO)
    // Si algún proceso estaba ejecutándose en el instante anterior, FCFS debe respetarlo.
    const procesoEnCurso = procesos.find(p => 
        p.ejecucion.length > 0 && 
        p.ejecucion[p.ejecucion.length - 1] === 'ejecutando'
    );

    if (procesoEnCurso) {
        return procesoEnCurso;
    }

    // 2. SI LA CPU ESTÁ LIBRE, ELEGIR POR LLEGADA
    // (Ordenamos por orden de llegada)
    let disponibles = [...procesos];
    disponibles.sort((a, b) => a.programa.instanteLlegada - b.programa.instanteLlegada);

    return disponibles[0];
  }

  asignarEjecucion(proceso) {
    // Devolvemos 1 para avanzar segundo a segundo
    return 1;
  }
}
class ShortestJob extends Algoritmo {

  constructor() {
    super()
  }

  sigProceso(procesos, instante) {
    if (procesos.length === 0) return null;

    // 1. REGLA DE ORO (NO EXPROPIATIVO):
    // Buscamos si alguno de los candidatos ya estaba corriendo en el último instante.
    // Si existe, TIENE que seguir ejecutándose hasta terminar o bloquearse.
    const procesoEnCurso = procesos.find(p => 
        p.ejecucion.length > 0 && 
        p.ejecucion[p.ejecucion.length - 1] === 'ejecutando'
    );

    if (procesoEnCurso) {
        return procesoEnCurso;
    }

    // 2. SI LA CPU ESTÁ LIBRE:
    // Ordenamos por Duración Total (Criterio SJF Clásico)
    let disponibles = [...procesos];
    
    disponibles.sort((a, b) => {
      // Ordenar por duración total del programa
      let criterioA = a.programa.duracion;
      let criterioB = b.programa.duracion;
      
      // Desempate por orden de llegada (FIFO)
      if (criterioA === criterioB) {
        return a.programa.instanteLlegada - b.programa.instanteLlegada;
      }
      return criterioA - criterioB;
    });

    return disponibles[0];
  }

  asignarEjecucion(proceso) {
    return 1; // Tick a Tick
  }
}

class ShortReamingTime extends Algoritmo {

  constructor() {
    super()
  }

  sigProceso(procesos, instante) {
    // 1. FILTRADO (Solo procesos listos para ejecutarse)
    // Usamos spread [...] para trabajar con una copia y no afectar el orden original
    let disponibles = [...procesos];

    if (disponibles.length === 0) return null;

    // 2. ORDENAR POR TIEMPO RESTANTE (El corazón del SRTF)
    disponibles.sort((a, b) => {
      let restanteA = a.programa.duracion - a.tiempoEjecutado;
      let restanteB = b.programa.duracion - b.tiempoEjecutado;
      
      // Si empatan, FIFO (gana el que llegó antes)
      if (restanteA === restanteB) {
        return a.programa.instanteLlegada - b.programa.instanteLlegada;
      }
      return restanteA - restanteB;
    });

    // El candidato ideal matemático es el primero de la lista (el más corto)
    let candidatoIdeal = disponibles[0];

    // 3. LÓGICA DE ESTABILIDAD (Evitar cambios innecesarios)
    // Buscamos quién estaba corriendo en el último tick
    const procesoEnCurso = procesos.find(p => 
        p.ejecucion.length > 0 && 
        p.ejecucion[p.ejecucion.length - 1] === 'ejecutando'
    );

    // Si había alguien corriendo y sigue estando en la lista de disponibles...
    if (procesoEnCurso && disponibles.includes(procesoEnCurso)) {
        
        let restanteActual = procesoEnCurso.programa.duracion - procesoEnCurso.tiempoEjecutado;
        let restanteIdeal = candidatoIdeal.programa.duracion - candidatoIdeal.tiempoEjecutado;

        // SOLO cambiamos si el candidato ideal es ESTRICTAMENTE menor
        // Esto cumple la regla: "Mirar si es más corto que lo que queda"
        if (restanteIdeal < restanteActual) {
            return candidatoIdeal; // Evento: Llegó alguien más rápido -> Expropiación
        } else {
            return procesoEnCurso; // No hay razón para cambiar, seguimos con el actual
        }
    }

    // Si nadie estaba corriendo (o el que corría se bloqueó/terminó), elegimos al mejor
    return candidatoIdeal;
  }

  asignarEjecucion(proceso) {
    return 1; // Evaluamos cada tick para detectar llegadas
  }
}
class RoundRobin extends Algoritmo {

  constructor(quantum) {
    super();
    this.quantum = parseInt(quantum);
    this.contadorQuantum = 0;
    this.ultimoEjecutado = null;
    this.colaRR = [];
    this.enOverhead = false;
    // Nueva bandera: Para forzar el despachador en el primer segundo
    this.esInicio = true; 
  }

  sigProceso(candidatos, instante) {
    // 1. Sincronizar Cola
    const estabaEnCola = [...this.colaRR];
    
    this.colaRR = this.colaRR.filter(p => candidatos.includes(p));
    
    candidatos.forEach(p => {
        if (!this.colaRR.includes(p)) {
            this.colaRR.push(p);
        }
    });

    // Si no hay nadie, reseteamos todo (incluyendo la bandera de inicio por si vuelven a llegar)
    if (this.colaRR.length === 0) {
        this.contadorQuantum = 0;
        this.ultimoEjecutado = null;
        this.enOverhead = false;
        this.esInicio = true; // Reseteamos para el futuro
        return null;
    }

    // === LÓGICA DE CARGA INICIAL (TU SOLICITUD) ===
    // Si es la primera vez que vamos a ejecutar algo, entra el Despachador primero
    if (this.esInicio) {
        this.esInicio = false;
        this.enOverhead = true; // Preparamos para que en el sig. turno entre el proceso
        return 'despachador';
    }

    // === LÓGICA DE RETORNO DEL DESPACHADOR ===
    if (this.enOverhead) {
        this.enOverhead = false;
        this.contadorQuantum = 0;
        this.ultimoEjecutado = this.colaRR[0];
        return this.colaRR[0];
    }

    // === DETECCIÓN DE SALIDA ABRUPTA (Bloqueo/Terminación) ===
    if (this.ultimoEjecutado && !candidatos.includes(this.ultimoEjecutado)) {
        this.enOverhead = true;
        this.ultimoEjecutado = null;
        return 'despachador';
    }

    let actual = this.colaRR[0];

    // === LÓGICA DE QUANTUM ===
    if (actual === this.ultimoEjecutado) {
        this.contadorQuantum++;
        
        if (this.contadorQuantum >= this.quantum) {
            if (this.colaRR.length > 1) {
                this.colaRR.shift();
                this.colaRR.push(actual);
                this.enOverhead = true;
                return 'despachador'; 
            } 
            else {
                this.contadorQuantum = 0;
            }
        }
    } else {
        this.contadorQuantum = 0;
    }

    this.ultimoEjecutado = actual;
    return actual;
  }

  asignarEjecucion(proceso) {
    return 1;
  }
}
