let cy;
        let addingNode = false;
        let connectingNodes = false;
        let sourceNodeId = null;
        let eliminatingElement = false;

        // Get the modal
        var modal = document.getElementById("infoModal");

        // Get the button that opens the modal
        var btn = document.getElementById("floating-action-button");

        // Get the element that closes the modal
        var span = document.getElementsByClassName("close-btn")[0];

        // When the user clicks the button, open the modal 
        btn.onclick = function () {
            modal.style.display = "block";
        }

        // When the user clicks on (x), close the modal
        span.onclick = function () {
            modal.style.display = "none";
        }

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }

        function toggleKruskalMenu(event) {
            event.preventDefault();
            let menu = document.getElementById('kruskalMenu');
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            menu.style.left = event.clientX + 'px';
            menu.style.top = event.clientY + 'px';
        }


        /////Esta es la función que hace que no haya puntos muertos ni que haya que volver
        function encontrarCaminoHamiltoniano() {
            let nodos = cy.nodes().toArray();
            if (nodos.length === 0) return [];

            let camino = [];
            let nodoActual = nodos[0];
            let visitados = new Set();
            visitados.add(nodoActual.id());
            camino.push(nodoActual);

            while (camino.length < nodos.length) {
                let vecinoMasCercano = null;
                let distanciaMinima = Infinity;
                nodoActual.neighborhood('node').forEach((vecino) => {
                    if (!visitados.has(vecino.id())) {
                        let peso = nodoActual.edgesWith(vecino)[0].data('weight');
                        if (peso < distanciaMinima) {
                            distanciaMinima = peso;
                            vecinoMasCercano = vecino;
                        }
                    }
                });

                if (vecinoMasCercano) {
                    camino.push(vecinoMasCercano);
                    visitados.add(vecinoMasCercano.id());
                    nodoActual = vecinoMasCercano;
                } else {
                    // No se encontró un vecino válido, esto no debería ocurrir si el grafo es conexo
                    break;
                }
            }

            return camino;
        }

        function kruskal(action) {
            if (action !== 'minimize') return;

            setupUnionFind();

            let caminoHamiltoniano = encontrarCaminoHamiltoniano();
            let edges = [];
            let totalWeight = 0;
            let recorrido = [];
            let nodoInicial = null;
            let nodoFinal = null;

            for (let i = 0; i < caminoHamiltoniano.length - 1; i++) {
                let source = caminoHamiltoniano[i];
                let target = caminoHamiltoniano[i + 1];
                let edge = source.edgesWith(target)[0];
                edges.push(edge);
            }

            edges.sort((a, b) => a.data('weight') - b.data('weight'));

            let mst = [];
            edges.forEach(edge => {
                let source = find(edge.source().id());
                let target = find(edge.target().id());
                if (source !== target) {
                    mst.push(edge);
                    union(source, target);
                    totalWeight += edge.data('weight');
                }
            });

            // Encontrar el nodo inicial y el nodo final
            let nodeDegrees = {};
            mst.forEach(edge => {
                let source = edge.source().id();
                let target = edge.target().id();
                if (!nodeDegrees[source]) nodeDegrees[source] = 0;
                if (!nodeDegrees[target]) nodeDegrees[target] = 0;
                nodeDegrees[source]++;
                nodeDegrees[target]++;
            });

            for (let nodeId in nodeDegrees) {
                if (nodeDegrees[nodeId] === 1) {
                    if (!nodoInicial) {
                        nodoInicial = nodeId;
                    } else {
                        nodoFinal = nodeId;
                    }
                }
            }

            // Crear el recorrido empezando desde el nodo inicial
            let currentNode = nodoInicial;
            let visitedNodes = new Set();
            while (currentNode) {
                visitedNodes.add(currentNode);
                recorrido.push(currentNode);

                let nextEdge = mst.find(edge => edge.source().id() === currentNode && !visitedNodes.has(edge.target().id())) ||
                    mst.find(edge => edge.target().id() === currentNode && !visitedNodes.has(edge.source().id()));

                if (nextEdge) {
                    currentNode = nextEdge.source().id() === currentNode ? nextEdge.target().id() : nextEdge.source().id();
                } else {
                    currentNode = null;
                }
            }

            // Actualizar el estilo de las aristas del MST
            cy.edges().forEach(edge => {
                edge.style('line-color', 'gray');
                edge.style('width', 2);
            });
            mst.forEach(edge => {
                edge.style('line-color', 'green');
                edge.style('width', 4);
            });

            // Mostrar el resultado en la consola
            console.log("Suma de pesos total:", totalWeight);
            console.log("Recorrido:", recorrido.join(" --> "));

            // Actualizar el label con la suma total de los pesos y mostrar el label
            const resultadoSuma = document.getElementById('resultadoSuma');
            resultadoSuma.textContent = "Suma de pesos total: " + totalWeight;
            resultadoSuma.style.display = "block"; // Mostrar el label

            // Actualizar el label con el recorrido y mostrar el label
            const recorridoLabel = document.getElementById('recorrido');
            recorridoLabel.textContent = "Recorrido: " + recorrido.join(" --> ");
            recorridoLabel.style.display = "block"; // Mostrar el label

            document.getElementById('kruskalMenu').style.display = 'none'; // Ocultar menú
        }

        function agregarVariasConexiones(conexiones) {
            conexiones.forEach(conexion => {
                conectarNodosConsola(conexion.source, conexion.target, conexion.weight);
            });
            console.log(`${conexiones.length} conexiones agregadas.`);
        }


        function agregarVariosNodos(nodos) {
            nodos.forEach(nodo => {
                agregarNodoConsola(nodo.id, nodo.label, nodo.x, nodo.y);
            });
            console.log(`${nodos.length} nodos agregados.`);
        }



        function agregarNodoConsola(id, label, x, y) {
            const newSize = getNodeSize(label); // Obtener el tamaño dinámico del nodo
            cy.add({
                group: 'nodes',
                data: {
                    id: id,
                    label: label,
                    width: newSize.width, // Establecer ancho calculado
                    height: newSize.height // Establecer alto calculado
                },
                position: {
                    x: x,
                    y: y
                }
            });
            console.log(`Nodo agregado: ${id} (${label}) en (${x}, ${y})`);
        }


        function conectarNodosConsola(sourceNodeId, targetNodeId, weight) {
            if (!cy.edges().some(edge => {
                return (edge.data('source') === sourceNodeId && edge.data('target') === targetNodeId) ||
                    (edge.data('source') === targetNodeId && edge.data('target') === sourceNodeId);
            })) {
                cy.add({
                    group: "edges",
                    data: {
                        id: sourceNodeId + "->" + targetNodeId,
                        source: sourceNodeId,
                        target: targetNodeId,
                        weight: parseInt(weight)
                    }
                });
                console.log(`Arista agregada: ${sourceNodeId} -> ${targetNodeId} con peso ${weight}`);
            } else {
                console.log("Estos nodos ya están conectados o ha seleccionado el mismo nodo.");
            }
        }





        function otraAccion() {
            // Lógica para otra acción
            document.getElementById('resultadoSuma').style.display = 'none'; // Asegurar que el label se oculta
        }

        // Ocultar menú al hacer clic fuera
        window.onclick = function (event) {
            if (!event.target.matches('#CalcularHolguraButton')) {
                var kruskalMenu = document.getElementById("kruskalMenu");
                if (kruskalMenu.style.display === 'block') {
                    kruskalMenu.style.display = 'none';
                }
            }
        }

        function toggleAgregarNodo() {
            addingNode = !addingNode;
            let agregarNodoButton = document.getElementById("agregarNodoButton");
            let conectarNodosButton = document.getElementById(
                "conectarNodosButton"
            );

            if (addingNode) {
                agregarNodoButton.textContent = "Desactivar Agregación";
                connectingNodes = false; // Asegurarse de desactivar el modo de conexión
                conectarNodosButton.textContent = "Conectar Nodos";
            } else {
                agregarNodoButton.textContent = "Agregar Nodo";
            }

            toggleBotonesEstado();
        }

        function toggleAgregarConexion() {
            connectingNodes = !connectingNodes;
            let conectarNodosButton = document.getElementById(
                "conectarNodosButton"
            );
            let agregarNodoButton = document.getElementById("agregarNodoButton");

            if (connectingNodes) {
                conectarNodosButton.textContent = "Desactivar Conexión";
                addingNode = false; // Asegurarse de desactivar el modo de agregación
                agregarNodoButton.textContent = "Agregar Nodo";
            } else {
                conectarNodosButton.textContent = "Conectar Nodos";
            }

            toggleBotonesEstado();
        }

        function getNodeSize(label) {
            const textLength = label.length;
            const baseSize = 30; // Tamaño base para nodos con texto corto
            const width = baseSize + textLength * 8; // Ajusta el multiplicador según sea necesario
            const height = baseSize + 20; // Añade un padding extra para mantener la forma ovalada
            return {
                width: `${width}px`,
                height: `${height}px`
            };
        }

        function iniciarCytoscape() {
            cy = cytoscape({
                container: document.getElementById("lienzo"),
                elements: [],
                style: [
                    {
                        selector: "node",
                        style: {
                            "background-color": "gray",
                            label: "data(label)",
                            "text-halign": "center",
                            "text-valign": "center",
                            color: "white",
                            "shape": "ellipse", // Cambiar la forma a ovalada
                            "width": "data(width)", // Ajustar el ancho dinámicamente
                            "height": "data(height)" // Ajustar el alto dinámicamente
                        },
                    },
                    {
                        selector: "edge",
                        style: {
                            width: 2,
                            label: "data(weight)",
                            color: "#666",
                            "font-size": "20px",
                            "text-background-color": "white",
                            "text-background-opacity": "1",
                            "text-background-padding": "3px",
                            "text-background-shape": "roundrectangle",
                            "text-background-color": "#ffffff",
                        },
                    },
                ],
                layout: {
                    name: "grid",
                    rows: 1,
                },
            });

            cy.on('tap', function (event) {
                if (addingNode) {
                    agregarNodo(event);
                } else if (connectingNodes) {
                    conectarNodos(event);
                }
            });

            cy.on("position", "node", function (event) {
                let node = event.target;
                let label = document.getElementById(node.id() + "-label");
                if (label) {
                    let position = node.renderedPosition();
                    label.style.left = `${position.x}px`;
                    label.style.top = `${position.y + 30}px`;
                }
            });

            cy.on("tap", "node, edge", function (evt) {
                if (eliminatingElement) {
                    let element = evt.target;
                    element.remove(); // Elimina el nodo o la arista del grafo
                }
            });

            let lastTapTime = 0;
            const doubleTapDelay = 350; // Tiempo en milisegundos para considerar dos toques como un doble clic

            cy.on('tap', 'node', function (event) {
                const currentTime = new Date().getTime();
                const node = event.target;
                if (currentTime - lastTapTime < doubleTapDelay) {
                    // Doble clic detectado
                    const oldLabel = node.data('label');
                    const newLabel = prompt("Ingrese el nuevo nombre para el nodo:", oldLabel);
                    if (newLabel !== null && newLabel !== oldLabel) {
                        node.data('label', newLabel);

                        // Ajustar tamaño del nodo
                        const newSize = getNodeSize(newLabel);
                        node.data('width', newSize.width);
                        node.data('height', newSize.height);
                    }
                }
                lastTapTime = currentTime;
            });

            cy.on('tap', 'edge', function (event) {
                const currentTime = new Date().getTime();
                const edge = event.target;
                if (currentTime - lastTap < tapTimeout) {
                    // Doble clic detectado
                    const oldWeight = edge.data('weight');
                    const newWeight = prompt("Ingrese el nuevo peso para la arista:", oldWeight);
                    if (newWeight !== null && !isNaN(newWeight) && newWeight !== oldWeight) {
                        edge.data('weight', parseInt(newWeight));
                    }
                }
                lastTap = currentTime;
            });
        }

        function agregarNodo(event) {
            if (!addingNode) return;  // Asegúrate de que el modo de agregar nodos esté activo.

            const label = prompt("Ingrese el nombre del nodo:"); // Solicita al usuario un nombre para el nodo.
            if (label) {
                const newSize = getNodeSize(label); // Obtener el tamaño dinámico del nodo
                cy.add({
                    group: 'nodes',
                    data: {
                        id: label,
                        label: label,
                        width: newSize.width, // Establecer ancho calculado
                        height: newSize.height // Establecer alto calculado
                    },
                    position: {
                        x: event.position.x,
                        y: event.position.y
                    }
                });
            }
        }

        function conectarNodos(event) {
            if (!connectingNodes) return;

            let targetNode = event.target;

            // Verificar que el targetNode es un nodo, no una arista o el fondo.
            if (!targetNode || targetNode === cy || targetNode.group() !== 'nodes') {
                return;
            }

            // Limpiar cualquier resaltado previo si se inicia una nueva conexión
            cy.nodes().removeClass('highlighted');

            // Si sourceNodeId no está establecido, este nodo será el nodo fuente.
            if (!sourceNodeId) {
                sourceNodeId = targetNode.id();
                targetNode.addClass('highlighted'); // Resaltar el nodo fuente.
                return;
            }

            // Si ya estamos aquí, significa que sourceNodeId está establecido y se selecciona el nodo destino.
            const targetNodeId = targetNode.id();

            // Verificar si ya existe una arista entre estos dos nodos para evitar duplicados.
            if (sourceNodeId !== targetNodeId && !cy.edges().some(edge => {
                return (edge.data('source') === sourceNodeId && edge.data('target') === targetNodeId) ||
                    (edge.data('source') === targetNodeId && edge.data('target') === sourceNodeId);
            })) {
                const weight = prompt("Ingrese el peso de la arista:");
                if (weight && !isNaN(weight)) {
                    cy.add({
                        group: "edges",
                        data: {
                            id: sourceNodeId + "->" + targetNodeId,
                            source: sourceNodeId,
                            target: targetNodeId,
                            weight: parseInt(weight)
                        }
                    });
                }
            } else {
                alert("Estos nodos ya están conectados o ha seleccionado el mismo nodo.");
            }

            // Reiniciar el estado para permitir una nueva conexión.
            sourceNodeId = null;
            cy.nodes().removeClass('highlighted'); // Quitar el resaltado de todos los nodos.
        }


        function eliminarTodo() {
            cy.elements().remove();
            const etiquetasNodos = document.querySelectorAll(".node-label");
            etiquetasNodos.forEach((etiqueta) => etiqueta.remove());

            const etiquetasHolgura = document.querySelectorAll(".holgura-label");
            etiquetasHolgura.forEach((etiqueta) => etiqueta.remove());
        }

        function toggleEliminarElemento() {
            eliminatingElement = !eliminatingElement;
            let button = document.getElementById("eliminarElementoButton");
            button.textContent = eliminatingElement
                ? "Desactivar Eliminación"
                : "Eliminar Elemento";

            toggleBotonesEstado();
        }

        function guardarDatos() {
            const graphJson = cy.json();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphJson));

            // Solicitar al usuario un nombre de archivo
            let filename = prompt("Ingrese el nombre del archivo:", "graphData.json");
            if (!filename) {
                filename = "graphData.json";  // Si no se proporciona un nombre, usar un nombre por defecto
            } else if (!filename.endsWith(".json")) {
                filename += ".json";  // Asegurarse de que el nombre de archivo tenga la extensión .json
            }

            const downloadAnchorNode = document.createElement("a");
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", filename);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }


        function cargarDatos() {
            const inputElement = document.getElementById('fileInput');
            inputElement.addEventListener('change', function (event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (fileEvent) {
                        try {
                            const json = JSON.parse(fileEvent.target.result);
                            cy.json(json);

                            inputElement.value = '';

                        } catch (error) {
                            alert('Error al cargar el archivo: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        cargarDatos();

        document
            .getElementById("fileInput")
            .addEventListener("change", function (event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (fileEvent) {
                        try {
                            const json = JSON.parse(fileEvent.target.result);
                            cy.json(json);
                        } catch (error) {
                            alert("Error al cargar el archivo: " + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
            });

        function toggleBotonesEstado() {
            document.getElementById("agregarNodoButton").disabled = connectingNodes;
            document.getElementById("conectarNodosButton").disabled = addingNode;
            document.getElementById("eliminarElementoButton").disabled =
                addingNode || connectingNodes;
        }

        // Estructura Union-Find para manejar la unión y búsqueda de componentes
        let parent = {};
        let rank = {};

        function find(node) {
            if (parent[node] !== node) {
                parent[node] = find(parent[node]);
            }
            return parent[node];
        }

        function union(node1, node2) {
            let root1 = find(node1);
            let root2 = find(node2);

            if (root1 !== root2) {
                if (rank[root1] > rank[root2]) {
                    parent[root2] = root1;
                } else if (rank[root1] < rank[root2]) {
                    parent[root1] = root2;
                } else {
                    parent[root2] = root1;
                    rank[root1] += 1;
                }
            }
        }

        function setupUnionFind() {
            cy.nodes().forEach(node => {
                parent[node.id()] = node.id();
                rank[node.id()] = 0;
            });
        }

        iniciarCytoscape();