class ContextoGestMem {
    #estadoPart = null;
    constructor(gestionInicial = new GestionTamFijo()) {
        this.#estadoPart = gestionInicial;
    }

    setGestor(gestor) {
        this.#estadoPart = gestor;
    }

    iniciarParts(tamanoSO, tamMemoria) {
        return this.#estadoPart.iniciarParts(tamanoSO, tamMemoria);
    }

    iniciarProceso(parts, indPart, programa, pid) {
        return this.#estadoPart.iniciarProceso(parts, indPart, programa, pid);
    }
    terminarProceso(parts, indPart) {
        return this.#estadoPart.terminarProceso(parts, indPart);
    }
}

class MetodoGestion {
    iniciarParts(tamanoSO, tamMemoria) {
        throw new Error("Method 'iniciarParts(tamanoSO)' must be implemented.");
    }

    iniciarProceso(parts, indPart, app, pid) {
        throw new Error("Method 'iniciarProceso(parts, indPart, app)' must be implemented.");
    }
    terminarProceso(parts, indPart) {
        throw new Error("Method 'terminarProceso(parts, indPart)' must be implemented.");
    }
}

class MetodoEstatico extends MetodoGestion {
    iniciarProceso(parts, indPart, app, pid) {
        parts[indPart].proceso = new Proceso(pid, app);
    }
    terminarProceso(parts, indPart) {
        parts[indPart].proceso = null;
    }
}

class GestionTamFijo extends MetodoEstatico {
    iniciarParts(tamanoSO, tamMemoria) {
        let memSinReservar = tamMemoria;
        let particiones = [];
        // Primera particion: SO
        let i = 0;
        particiones.push(new Particion(i, tamanoSO, "SO"));
        memSinReservar -= tamanoSO;
        while (memSinReservar >= tamanoSO) {
            i++;
            particiones.push(new Particion((i * tamanoSO), tamanoSO));
            memSinReservar -= tamanoSO;
        }
        return particiones;
    }
}
/*
class GestionTamVariable extends MetodoEstatico {
    iniciarParts(tamanoSO, tamMemoria) {
        let memSinReservar = tamMemoria;
        let particiones = [];
        // Primera particion: SO
        let i = 0;
        particiones.push(new Particion(0, tamanoSO, "SO"));
        memSinReservar -= tamanoSO;
        let posicion = tamanoSO;
        while (true) {
            i++;
            let tamano = tamanoSO * Math.pow(2, i);
            if(tamano > memSinReservar){
                break
            }
            particiones.push(new Particion(posicion, tamano));
            posicion += tamano;
            memSinReservar -= tamano;
        }
        return particiones;
    }
}*/
class GestionTamVariable extends MetodoEstatico {
  iniciarParts(tamanoSO, tamMemoria) {
    let particiones = [];
    let posicion = 0;

    // 1 MB para el SO
    particiones.push(new Particion(posicion, 1048576, "SO"));
    posicion += 1048576;

    // 2 de 4 MB
    for (let i = 0; i < 2; i++) {
      particiones.push(new Particion(posicion, 4194304));
      posicion += 4194304;
    }

    // 2 de 2 MB
    for (let i = 0; i < 2; i++) {
      particiones.push(new Particion(posicion, 2097152));
      posicion += 2097152;
    }

    // 2 de 1 MB (además del SO)
    for (let i = 0; i < 2; i++) {
      particiones.push(new Particion(posicion, 1048576));
      posicion += 1048576;
    }

    // 2 de 0.5 MB
    for (let i = 0; i < 2; i++) {
      particiones.push(new Particion(posicion, 524288));
      posicion += 524288;
    }

    return particiones;
  }
}


class MetodoDinamicoSinCompactacion extends MetodoEstatico {
    validarParticiones(parts, indPart){
        if(indPart != 0 && parts[indPart-1].proceso == null){
            parts[indPart-1].tamano += parts[indPart].tamano;
            parts.splice(indPart, 1); 
            indPart--;
        }

        if(indPart != parts.length-1 && parts[indPart+1].proceso == null){
            parts[indPart].tamano += parts[indPart+1].tamano;
            parts.splice(indPart+1, 1);
        }
    }

    iniciarParts(tamanoSO, tamMemoria) {
        return [new Particion(0, tamanoSO, "SO"), new Particion(tamanoSO, tamMemoria-tamanoSO)]
    }

    iniciarProceso(parts, indPart, app, pid) {
        let nuevoProceso = new Proceso(pid, app);
        let nuevaPart = new Particion(parts[indPart].dirInicio, app.tamano, nuevoProceso);
        parts[indPart].dirInicio = parts[indPart].dirInicio+app.tamano;
        parts[indPart].tamano = parts[indPart].tamano-app.tamano;
        if(parts[indPart].tamano != 0){
            parts.splice(indPart, 0, nuevaPart);
        }
        else{
            parts[indPart] = nuevaPart;
        }
    }
    terminarProceso(parts, indPart) {
        parts[indPart].proceso = null;
        this.validarParticiones(parts, indPart);
    }
}


class MetodoDinamicoConCompactacion extends MetodoDinamicoSinCompactacion {
    compactar(parts){
        let compactado = [];
        let tamanoTotal = 0;
        parts.forEach(e => {
            tamanoTotal += e.tamano;
            if(e.proceso != null){
                let indice = compactado.push(e)-1;
                if(indice == 0){
                    compactado[indice].dirInicio = 0;
                }
                else {
                    compactado[indice].dirInicio = compactado[indice-1].dirInicio+compactado[indice-1].tamano
                }
            }
        });
        let ultiInd = compactado.length-1;
        let inicioPartVacia = compactado[ultiInd].dirInicio+compactado[ultiInd].tamano;
        compactado.push(new Particion(inicioPartVacia, tamanoTotal-inicioPartVacia))
        // Reemplaza el contenido de parts con el de compactado sin cambiar la referencia
        parts.splice(0, parts.length,...compactado); 
    }
    terminarProceso(parts, indPart) {
        parts[indPart].proceso = null;
        this.validarParticiones(parts, indPart);
        this.compactar(parts);
    }
}