// programa
class Programa {
  // stack and heap predefiidos
  static stack = 65536;
  static heap = 131072;

  //contructor de cada programa
  constructor(nombre, text, data, bss) {
    this.nombre = nombre;
    this.text = text;
    this.data = data;
    this.bss = bss;
  }

  // tamaño de cada programa
  get tamano() {
    return this.text + this.data + this.bss + Programa.stack + Programa.heap;
  }
}

// proceso que tiene la informacion del programa el id, y la division en la tabla
class Proceso {
  constructor(id, programa, tablaDivision) {
    this.id = id;
    this.programa = programa;
    this.segmentos = tablaDivision; // Es un arreglo de Segmento o Pagina
  }
}

class Segmento {
  constructor(num, base, limite, permisos) {
    //numero de segmentos 
    this.numSeg = num;
    this.base = base;
    this.limite = limite;
    this.permisos = permisos;
  }
}

class Pagina {
  constructor(pag, marco) {
    this.numPag = pag;
    this.marco = marco;
  }
}

// Representa los segmentos en su orden fisico real, pa la grafica
class Particion {
  constructor(dirInicio = 0, tamano = 0, proceso = null) {
    this.dirInicio = dirInicio;
    this.tamano = tamano;
    this.proceso = proceso;
  }
}

class Memoria {
  ultimoPid = 1;
  procesos = []
  #ajuste;
  #metodoGestionMem;

  constructor(tamSo = 1048576, tamMem = 16777216) {
    this.#ajuste = new ContextoAjuste();
    this.#metodoGestionMem = new ContextoGestMem();
    this.tamSo = tamSo;
    this.tamanoMem = tamMem;
    this.particiones = this.#metodoGestionMem.iniciarParts(tamSo, tamMem);
  }

  setAjuste(ajuste) {
    //ajusta el ajuste dependiendo de si es segmentacion o paginacion
    if (ajuste == 'primer') {
      this.#ajuste = new PrimerAjuste();
    }
    else if (ajuste == 'mejor') {
      this.#ajuste = new MejorAjuste();
    }
  }

  resetMemory(){
    this.particiones = this.#metodoGestionMem.iniciarParts(this.tamSo, this.tamanoMem);
    this.ultimoPid = 1;
    this.procesos = [];
  }
  
  setMetodoGestion(metodo) {
    if (metodo == 'segmentacion') {
      this.#metodoGestionMem.setGestor(new MetodoSegmentacion());
    }
    else if (metodo == 'paginacion') {
      this.#metodoGestionMem.setGestor(new MetodoPaginacion());
    }
    this.resetMemory();
  }

  ejecutarPrograma(programa) {
    let indPart = this.#ajuste.encontrarPart(this.particiones, programa);
    if (false) { //TODO verificar que el programa quepa
      throw ("No hay espacio suficiente");
    }
    else {
      this.ultimoPid++;
      let proceso = new Proceso(this.ultimoPid, programa, [])
      this.procesos.push(proceso)
      this.#metodoGestionMem.iniciarProceso(this.particiones, proceso, programa, this.ultimoPid);
    }
  }

  terminarPrograma(indProceso) {
    if (this.procesos[indProceso] == null) {
      return;
    }
    this.#metodoGestionMem.terminarProceso(this.particiones, this.procesos[indProceso]);
    this.procesos.splice(indProceso, 1)
  }

  get metodoMem(){
    return this.#metodoGestionMem.metodoMem;
  }
}
