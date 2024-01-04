$(document).ready(function () {
    const tablaResultados = $("#tablaResultados");
    const registroForm = $("#registroForm");
    const calcularBtn = $("#calcularBtn");
    const borrarTodoBtn = $("#borrarTodoBtn");
    const advertenciaModal = $("#advertenciaModal");
    const tablaDatos = $("#tablaDatos").DataTable({
        paging: true,
        pageLength: 5,
        responsive: {
            details: {
                display: DataTable.Responsive.display.childRowImmediate,
                target: '',
                type: 'none'
            }
        },
        columns: [
            { title: "Fecha" },
            { title: "Kilómetros" },
            { title: "Litros" },
            { title: "Consumo" },
            { title: "Acción" }
        ],
        columnDefs: [
            {   
                targets: 0,
                render: function (data, type, full, meta) {
                    if (type === "display") {
                        return formatearFecha(data);
                    }
                    return data;
                },
                type: "date-euro"
            }
        ],
        order: [[0, "desc"]],
        language: {
            processing: "Procesando...",
            lengthMenu: "Mostrar _MENU_",
            zeroRecords: "No se encontraron resultados",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            emptyTable: "Sin registros de Consumo de Combustible :(",
            infoEmpty: "Sin registros",
            infoFiltered: "(filtrado de un total de _MAX_ registros)",
            search: "Buscar:",
            loadingRecords: "Cargando...",
            paginate: {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            }
        },
        lengthMenu: [
            [5, 10, 15, -1],
            [5, 10, 15, 'Todos']
        ]
    });

    function formatearFecha(fecha) {
        const partesFecha = fecha.split('-');
        const dia = partesFecha[2];
        const mes = partesFecha[1];
        const año = partesFecha[0];
        return `${dia}-${mes}-${año}`;
    }



    
    
    calcularBtn.on("click", function () {
        const kilometrosInput = $("#kilometros");
        const litrosInput = $("#litros");
        const fechaInput = $("#fecha").val();
        const kilometros = parseFloat(kilometrosInput.val());
        const litros = parseFloat(litrosInput.val());
        const fecha = fechaInput;
    
        if (isNaN(kilometros) || isNaN(litros) || fecha.trim() === "") {
            advertenciaModal.modal("show");
            return;
        }
    
        const consumo = (litros * 100) / kilometros;
        const id = obtenerNuevoID(); // Obtener un nuevo ID para el registro
        const resultado = {
            id: id, // Agregar el ID al objeto del registro
            fecha: fecha,
            kilometros: kilometros,
            litros: litros,
            consumo: consumo
        };
    
        tablaDatos.row.add([
            resultado.fecha,
            `${resultado.kilometros.toFixed(2)} km`,
            `${resultado.litros.toFixed(2)} L`,
            `${resultado.consumo.toFixed(2)} L cada 100km`,
            '<button class="btn btn-danger btn-sm btn-borrar" data-id="' + resultado.id + '"><i class="fa-sharp fa-solid fa-trash" style="color: #ffffff;"></i></button>'
        ]).draw();
        guardarResultadoLocalStorage(resultado);
        registroForm[0].reset();
        actualizarPromedioModal();
    });

    function obtenerNuevoID() {
        const resultadosGuardados = JSON.parse(localStorage.getItem("resultados")) || [];
        const ids = resultadosGuardados.map(resultado => resultado.id);
        const maxID = Math.max(...ids, 0);
        return maxID + 1;
    }
    
    

    borrarTodoBtn.on("click", function () {
        const resultadosGuardados = JSON.parse(localStorage.getItem("resultados")) || [];
        const confirmModalMessage = $("#confirmModalMessage");
        const noRecordsMessage = $("#noRecordsMessage");
    
        if (resultadosGuardados.length === 0) {
            confirmModalMessage.hide();
            noRecordsMessage.show();
            $("#confirmarBorrado").hide();
        } else {
            noRecordsMessage.hide();
            confirmModalMessage.show();
            $("#confirmarBorrado").show();
        }
    
        $("#confirmModal").modal("show");
    });

    $("#confirmarBorrado").on("click", function () {
        tablaDatos.clear().draw();
        localStorage.removeItem("resultados");
        actualizarPromedioModal();
        $("#confirmModal").modal("hide");
    });

    tablaResultados.on("click", ".btn-borrar", function () {
        const fila = $(this).closest("tr");
        const id = $(this).data("id"); // Obtener el ID del botón
        const index = resultadosGuardados.findIndex(resultado => resultado.id === id); // Buscar el índice del registro con ese ID
    
        if ($(window).width() < 491) {
            location.reload();
        } else {
            tablaDatos.row(fila).remove().draw();
        }
        borrarResultadoLocalStorage(index);
    });
    

    $("#importarInput").on("change", function (e) {
        const archivo = e.target.files[0];
        if (!archivo) return;
    
        const lector = new FileReader();
        lector.onload = function (evento) {
            try {
                const resultadosImportados = JSON.parse(evento.target.result);
                const resultadosGuardados = JSON.parse(localStorage.getItem("resultados")) || [];
                const cantidadRegistros = resultadosImportados.length;
    
                if (cantidadRegistros > 0) {
                    const maxID = resultadosGuardados.reduce((max, resultado) => Math.max(max, resultado.id), 0);
                    resultadosImportados.forEach((resultado, index) => {
                        const id = maxID + index + 1; // Calcular el nuevo ID basado en el último ID en localStorage
                        tablaDatos.row.add([
                            resultado.fecha,
                            `${resultado.kilometros.toFixed(2)} km`,
                            `${resultado.litros.toFixed(2)} L`,
                            `${resultado.consumo.toFixed(2)} L cada 100km`,
                            `<button class="btn btn-danger btn-sm btn-borrar" data-id="${id}">
                                <i class="fa-sharp fa-solid fa-trash" style="color: #ffffff;"></i>
                            </button>`
                        ]).draw();
                        const nuevoResultado = {
                            id: id,
                            fecha: resultado.fecha,
                            kilometros: parseFloat(resultado.kilometros),
                            litros: parseFloat(resultado.litros),
                            consumo: parseFloat(resultado.consumo)
                        };
                        resultadosGuardados.push(nuevoResultado); // Agregar el registro al array
                    });
                    localStorage.setItem("resultados", JSON.stringify(resultadosGuardados)); // Guardar los registros en localStorage
                    actualizarPromedioModal();
                    const importResultMessage = $("#importResultMessage");
                    const modalMessage = `Se importó ${cantidadRegistros} registro/s exitosamente.`;
                    importResultMessage.text(modalMessage);
                    $("#importResultModal").modal("show");
                } else {
                    const importResultMessage = $("#importResultMessage");
                    const modalMessage = "No hay registros nuevos en el archivo para importar.";
                    importResultMessage.text(modalMessage);
                    $("#importResultModal").modal("show");
                }
            } catch (error) {
                console.error("Error al importar los resultados:", error);
            }
        };
        lector.readAsText(archivo);
    });
    
    
    


    $("#exportarBtn").on("click", function () {
        const resultadosGuardados = JSON.parse(localStorage.getItem("resultados")) || [];
    
        if (resultadosGuardados.length === 0) {
            const exportResultMessage = $("#exportResultMessage");
            const modalMessage = "No hay registros para exportar.";
            exportResultMessage.text(modalMessage);
            $("#exportResultModal").modal("show");
            return;
        }
    
        const resultadosExportados = JSON.stringify(resultadosGuardados, null, 2);
        const fechaHora = obtenerFechaHoraActual();
        const nombreArchivo = `Registros_combustible_${fechaHora}.json`;
    
        const blob = new Blob([resultadosExportados], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo;
        a.click();
        URL.revokeObjectURL(url);
    
        const exportResultMessage = $("#exportResultMessage");
        const modalMessage = `Se exportó ${resultadosGuardados.length} registro/s al archivo: '${nombreArchivo}'.`;
        exportResultMessage.text(modalMessage);
        $("#exportResultModal").modal("show");
    });
    
    
    function obtenerFechaHoraActual() {
        const now = new Date();
        const dia = String(now.getDate()).padStart(2, "0");
        const mes = String(now.getMonth() + 1).padStart(2, "0");
        const año = now.getFullYear();
        const horas = String(now.getHours()).padStart(2, "0");
        const minutos = String(now.getMinutes()).padStart(2, "0");
        return `${dia}_${mes}_${año}_${horas}_${minutos}`;
    }
    
    function guardarResultadoLocalStorage(resultado) {
        const resultadosGuardados = JSON.parse(localStorage.getItem("resultados")) || [];
    
        const nuevoResultado = {
            id: resultado.id, // Usar el ID asignado al registro
            fecha: resultado.fecha,
            kilometros: parseFloat(resultado.kilometros),
            litros: parseFloat(resultado.litros),
            consumo: parseFloat(resultado.consumo)
        };
    
        resultadosGuardados.push(nuevoResultado);
        localStorage.setItem("resultados", JSON.stringify(resultadosGuardados));
    }
    
    
    
    

    function borrarResultadoLocalStorage(index) {
        const resultadosGuardados = JSON.parse(localStorage.getItem("resultados")) || [];
        resultadosGuardados.splice(index, 1);
        localStorage.setItem("resultados", JSON.stringify(resultadosGuardados));
        actualizarPromedioModal();
    }

    function actualizarPromedioModal() {
        const resultadosGuardados = JSON.parse(localStorage.getItem("resultados")) || [];
        const totalConsumo = resultadosGuardados.reduce((total, resultado) => total + resultado.consumo, 0);
        const promedioConsumo = totalConsumo / resultadosGuardados.length;
    
        $("#promedioModalBody").text(promedioConsumo.toFixed(2) + " L/100km");
    }
    

    const resultadosGuardados = JSON.parse(localStorage.getItem("resultados")) || [];
    resultadosGuardados.forEach(resultado => {
        const newRow = tablaDatos.row.add([
            resultado.fecha,
            `${resultado.kilometros.toFixed(2)} km`,
            `${resultado.litros.toFixed(2)} L`,
            `${resultado.consumo.toFixed(2)} L cada 100km`,
            '<button class="btn btn-danger btn-sm btn-borrar" data-id="' + resultado.id + '"><i class="fa-sharp fa-solid fa-trash" style="color: #ffffff;"></i></button>'
        ]).draw();
    
        tablaDatos.draw(); // Dibujar la tabla
    });
    
    

    $("#promedioBtn").on("click", function () {
        const resultadosGuardados = JSON.parse(localStorage.getItem("resultados")) || [];
        const promedioModalBody = $("#promedioModalBody");
        if (resultadosGuardados.length === 0) {
            promedioModalBody.html("No hay datos disponibles para calcular el promedio.");
        } else {
            resultadosGuardados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); // Ordenar por fechas ascendentes
            const labels = resultadosGuardados.map(resultado => formatearFecha(resultado.fecha)); // Formatear las fechas
            const consumoData = resultadosGuardados.map(resultado => resultado.consumo.toFixed(2));
            const recorridoData = resultadosGuardados.map(resultado => resultado.kilometros.toFixed(2));
            const cargaData = resultadosGuardados.map(resultado => resultado.litros.toFixed(2));
            const contenidoModal = `
                <p>✓ Consumo cada 100 km: <span class="text-success fw-bold text-opacity-75">${obtenerPromedio(consumoData).toFixed(2)} L</span>.</p>
                <p>✓ Recorrido entre recargas: <span class="text-success fw-bold text-opacity-75">${obtenerPromedio(recorridoData).toFixed(2)} km</span>.</p>
                <p>✓ Carga al repostar: <span class="text-success fw-bold text-opacity-75">${obtenerPromedio(cargaData).toFixed(2)} L</span>.</p>
                <div class="mt-4">
                    <canvas id="graficoBarras"></canvas>
                </div>
            `;
            promedioModalBody.html(contenidoModal); 
            const ctx = document.getElementById('graficoBarras').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Consumo (L/100km)',
                        data: consumoData,
                        backgroundColor: 'rgba(0, 200, 0, 0.49)', // Color de las barras
                        borderColor: 'rgba(0, 200, 0, 1)', // Color del borde de las barras
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 5,
                            title: {
                                display: true,
                                text: 'Litros'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Fechas'
                            }
                        }
                    }
                }
            });
        }
        $("#promedioModal").modal("show");
    });
    
    
    function obtenerPromedio(valores) {
        const suma = valores.reduce((total, valor) => total + parseFloat(valor), 0);
        return suma / valores.length;
    }
    

    actualizarPromedioModal();

    $(".edit-btn").on("click", function() {
        var id = $(this).data("id");
        var registro = $("#registros").DataTable().row(this).data();
        $("#editar-registro").modal("show");
        $("#id-registro").val(id);
        $("#fecha-registro").val(registro.fecha);
        $("#litros-registro").val(registro.litros);
        $("#kilometros-registro").val(registro.kilometros);
    });

});
