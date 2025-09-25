
class Programa {
  constructor(nombre, tamano) {
    this.nombre = nombre;
    this.tamano = tamano;
  }
}

class Proceso {
  constructor(id, programa) {
    this.id = id;
    this.programa = programa;
  }
}

class Particion {
  constructor(dirInicio = 0, tamano = 0, proceso = null) {
    this.dirInicio = dirInicio;
    this.tamano = tamano;
    this.proceso = proceso;
  }
}

class Memoria {
  ultimoPid = 1;
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
    if (ajuste == 'primer') {
      this.#ajuste = new PrimerAjuste();
    }
    else if (ajuste == 'mejor') {
      this.#ajuste = new MejorAjuste();
    }
    else if (ajuste == 'peor') {
      this.#ajuste = new PeorAjuste();
    }
  }

  setMetodoGestion(metodo) {
    if (metodo == 'estatic-fijo') {
      this.#metodoGestionMem = new GestionTamFijo();
    }
    else if (metodo == 'estatic-variable') {
      this.#metodoGestionMem = new GestionTamVariable();
    }
    else if (metodo == 'dinamic-sin') {
      this.#metodoGestionMem = new MetodoDinamicoSinCompactacion();
    }
    else if (metodo == 'dinamic-con') {
      this.#metodoGestionMem = new MetodoDinamicoConCompactacion();
    }

    this.particiones = this.#metodoGestionMem.iniciarParts(this.tamSo, this.tamanoMem);
    this.ultimoPid = 1;
  }

  ejecutarPrograma(programa) {
    let indPart = this.#ajuste.encontrarPart(this.particiones, programa);
    if (indPart === false) {
      alert("No se puede ejecutar el programa");
    }
    else {
      this.#metodoGestionMem.iniciarProceso(this.particiones, indPart, programa, ++this.ultimoPid);
    }
  }

  terminarPrograma(indPart) {
    if (indPart === 0) {
      return;
    }
    this.#metodoGestionMem.terminarProceso(this.particiones, indPart);
  }
}