
class ContextoAjuste {
    #estadoAjuste = null;
    constructor(ajusteInicial = new PrimerAjuste()) {
        this.#estadoAjuste = ajusteInicial;
    }

    setAjuste(ajuste) {
        this.#estadoAjuste = ajuste;
    }

    encontrarPart(parts, programa) {
        return this.#estadoAjuste.encontrarPart(parts, programa);
    }
}

class Ajuste {
    constructor() {
        if (this.constructor == Ajuste) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    encontrarPart() {
        throw new Error("Method 'encontrarPart()' must be implemented.");
    }
}

class PrimerAjuste extends Ajuste {
    encontrarPart(parts, programa) {
        console.log("fdsf");
        let encontrado = false;
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].proceso == null && parts[i].tamano >= programa.tamano) {
                encontrado = i;
                break;
            }
        }
        return encontrado;
    }
}
/*
class MejorAjuste extends Ajuste {
    encontrarPart(parts, programa) {
        let iMasPequena = false;
        for (let i = 0; i < parts.length; i++) {
            let partDisponible = parts[i].proceso == null;
            let partMasOptima = !iMasPequena || parts[i].tamano < parts[iMasPequena].tamano;
            let partValida = programa.tamano <= parts[i].tamano;
            if (partDisponible && partMasOptima && partValida) {
                iMasPequena = i;
            }
        }
        return iMasPequena;
    }
}*/
class MejorAjuste extends Ajuste {
    encontrarPart(parts, programa) {
        let iMasPequena = -1; // -1 si no encuentra ninguna

        for (let i = 0; i < parts.length; i++) {
            let libre = parts[i].proceso == null;
            let cabe = programa.tamano <= parts[i].tamano;

            if (libre && cabe) {
                if (
                    iMasPequena === -1 || 
                    parts[i].tamano < parts[iMasPequena].tamano
                ) {
                    iMasPequena = i;
                }
            }
        }

        return iMasPequena;
    }
}

/*
class PeorAjuste extends Ajuste {
    encontrarPart(parts, programa) {
        console.log("hola");
        
        let iMasGrande = 0;
        let flagMasGrande = false;
        for (let i = 0; i < parts.length; i++) {
            let partDisponible = parts[i].proceso == null;
            let partMenosOptima = (!iMasGrande || parts[i].tamano > parts[iMasGrande].tamano);
            let partValida = programa.tamano <= parts[i].tamano;
            if (partDisponible && partMenosOptima && partValida) {
                iMasGrande = i;
            }
        }
        return iMasGrande;
    }
}*/
class PeorAjuste extends Ajuste {
    encontrarPart(parts, programa) {
        let iMasGrande = -1; // -1 si no encuentra ninguna

        for (let i = 0; i < parts.length; i++) {
            console.log("tamaño ",parts[i].tamano);
            
            let libre = parts[i].proceso == null;
            let cabe = programa.tamano <= parts[i].tamano;

            if (libre && cabe) {
                if (
                    iMasGrande === -1 || 
                    parts[i].tamano > parts[iMasGrande].tamano
                ) {
                    iMasGrande = i;
                }
            }
        }

        return iMasGrande;
    }
}
