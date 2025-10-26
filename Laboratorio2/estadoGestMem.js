class ContextoGestMem {
  #estadoPart = null;
  constructor(gestionInicial = new MetodoSegmentacion()) {
    this.#estadoPart = gestionInicial;
  }

  setGestor(gestor) {
    this.#estadoPart = gestor;
  }

  iniciarParts(tamanoSO, tamMemoria) {
    return this.#estadoPart.iniciarParts(tamanoSO, tamMemoria);
  }
  iniciarProceso(parts, ajuste, programa, pid) {
    return this.#estadoPart.iniciarProceso(parts, ajuste, programa, pid);
  }

  terminarProceso(parts, proceso) {
    return this.#estadoPart.terminarProceso(parts, proceso);
  }

  get metodoMem(){
    return this.#estadoPart instanceof MetodoSegmentacion ? 's' : 'p'
  }
}

class MetodoGestion {
  iniciarParts(tamanoSO, tamMemoria) {
    throw new Error("Method 'iniciarParts(tamanoSO)' must be implemented.");
  }

  iniciarProceso(parts, ajuste, app, pid) {
    throw new Error("Method 'iniciarProceso(parts, indPart, app)' must be implemented.");
  }
  terminarProceso(parts, indPart) {
    throw new Error("Method 'terminarProceso(parts, indPart)' must be implemented.");
  }
}

class MetodoSegmentacion extends MetodoGestion {

  static maxNumSegs = 32
  static maxOffset = 524288;
    static actualizarParametrosDesdeSelect() {
    const selectTam = document.getElementById("tamSeg");
    const valorSeleccionado = parseInt(selectTam.value);

    MetodoSegmentacion.maxNumSegs = 2 ** valorSeleccionado;
    MetodoSegmentacion.maxOffset = 2 ** (24 - valorSeleccionado);
    console.log("new segments:", MetodoSegmentacion.maxNumSegs);
    console.log("new segments:", MetodoSegmentacion.maxOffset);
    
  }
  
  iniciarParts(tamanoSO, tamMemoria) {
      return [new Particion(0, tamanoSO, "SO"), new Particion(tamanoSO, tamMemoria-tamanoSO)]
  }

  iniciarProceso(parts, proceso, app, pid) {
    
    let pendientes = {
      text: app.text,
      data: app.data, 
      bss: app.bss,
      stack: Programa.stack,
      heap: Programa.heap
    }
    
    let keys = ['text', 'data', 'bss', 'stack', 'heap']
    let permisos = ['RX', 'RW', 'RW', 'RW', 'RW']
    let pendienteTotal = app.text+app.data+app.bss+Programa.stack+Programa.heap;
    let i = 0; // Itera particiones
    let j = 0; // Itera keys
    let numSeg = 1;
    while(pendienteTotal > 0){
      let key = keys[j]
      if(parts[i].proceso == null){
        let tamano = parts[i].tamano <= MetodoSegmentacion.maxOffset ? parts[i].tamano : MetodoSegmentacion.maxOffset;
        if(tamano > pendientes[key]){
          tamano = pendientes[key];
        }
        if(parts[i].tamano - tamano > 0){ // La particion encontrada quedó con espacio
          let nuevaPart = new Particion(parts[i].dirInicio, tamano, proceso);
          parts[i].dirInicio += tamano;
          parts[i].tamano -= tamano;
          parts.splice(i, 0, nuevaPart); // se inserta una nueva y se le quita espacio a la existente
        }
        else { // Se usó todo el espacio de la particion, se reemplaza
          parts[i].proceso = proceso;
        }
        parts[i].tipo = key
        pendienteTotal-=tamano;
        pendientes[key] -= tamano;

        proceso.segmentos.push(new Segmento(numSeg, parts[i].dirInicio, tamano, permisos[j]))
        numSeg++;
        
        if(pendientes[key] == 0){
          j++;
        }
        else if(pendientes[key] < 0){
          console.log(' una parte del programa se asignó con más memoria de la que necesita')
        }
      }
      i++;
    }
  }
  terminarProceso(parts, proceso) {
    for(let part of parts){
      if(part.proceso == proceso){
        part.proceso = null;
        delete part.tipo
      }
    }
    this.unirParticiones(parts);
  }

  unirParticiones(parts){
    let ultimaVacia = null;
    for(let i=0; i<parts.length; i++){
      if(parts[i].proceso == null){
        let j = 0;
        while(parts[i+j+1] != undefined && parts[i+j+1].proceso == null){
          parts[i].tamano += parts[i+j+1].tamano;
          j++;
        }
        parts.splice(i+1, j);
      }
    }
  }
}

class MetodoPaginacion extends MetodoGestion {
  static maxNumPags = 255; 
  static tamMarcos = 65536;
  
  
  iniciarParts(tamanoSO, tamMemoria) {
    let memSinReservar = tamMemoria;
    let particiones = [];
    // Primera particion: SO
    let i = 0;
    let soSinReservar = tamanoSO;
    
    while (soSinReservar > 0) {
      let aReservar = memSinReservar >= MetodoPaginacion.tamMarcos ? MetodoPaginacion.tamMarcos : memSinReservar;
      particiones.push(new Particion(i * MetodoPaginacion.tamMarcos, aReservar, 'So'));
      memSinReservar -= MetodoPaginacion.tamMarcos;
      soSinReservar -= MetodoPaginacion.tamMarcos;
      i++;
    }

    while (memSinReservar >= MetodoPaginacion.tamMarcos) {
      let aReservar = memSinReservar >= MetodoPaginacion.tamMarcos ? MetodoPaginacion.tamMarcos : memSinReservar;
      particiones.push(new Particion(i * MetodoPaginacion.tamMarcos, aReservar));
      memSinReservar -= MetodoPaginacion.tamMarcos;
      i++;
    }
    return particiones;
  }

  iniciarProceso(parts, proceso, app, pid) {
    let pendientes = {
      text: app.text,
      data: app.data, 
      bss: app.bss,
      stack: Programa.stack,
      heap: Programa.heap
    }
    let pendienteTotal = app.text+app.data+app.bss+Programa.stack+Programa.heap;

    let keys = ['text', 'data', 'bss', 'stack', 'heap']
    let i = 0; // Itera particiones
    let j = 0; // Itera keys
    let numPag = 1;
    while(pendienteTotal > 0){
      let key = keys[j]
      if(parts[i].proceso == null){
        // Tamaño util reservado
        let tamanoReservado = pendientes[key] >= MetodoPaginacion.tamMarcos ? MetodoPaginacion.tamMarcos : pendientes[key];
        parts[i].proceso = proceso;
        parts[i].tipo = key;
        
        pendienteTotal -= tamanoReservado;
        pendientes[key] -= tamanoReservado;

        let pagina = new Pagina(numPag, i)
        pagina.presente = 'presente';
        proceso.segmentos.push(pagina);
        numPag++;
        
        if(pendientes[key] == 0){
          j++;
        }
        else if(pendientes[key] < 0){
          console.log('una parte del programa se asignó con más memoria de la que necesita')
        }
      }
      i++;
    }
  }


  terminarProceso(parts, proceso) {
    for(let part of parts){
      if(part.proceso == proceso){
        part.proceso = null;
        delete part.tipo;
        delete part.presente;
      }
    }
  }
}