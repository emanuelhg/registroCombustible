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
        const resultado = [fecha, `${kilometros.toFixed(2)} km`, `${litros.toFixed(2)} L`, `${consumo.toFixed(2)} L cada 100km`, '<button class="btn btn-danger btn-sm btn-borrar"><i class="fa-sharp fa-solid fa-trash" style="color: #ffffff;"></i></button>'];

        tablaDatos.row.add(resultado).draw();
        guardarResultadoLocalStorage(resultado);
        registroForm[0].reset();
        actualizarPromedioModal();
    });

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
        const index = tablaDatos.row(fila).index();
        tablaDatos.row(fila).remove().draw();
        borrarResultadoLocalStorage(index);
    });

    $("#importarInput").on("change", function (e) {
        const archivo = e.target.files[0];
        if (!archivo) return;
    
        const lector = new FileReader();
        lector.onload = function (evento) {
            try {
                const resultadosImportados = JSON.parse(evento.target.result);
                const cantidadRegistros = resultadosImportados.length;
    
                if (cantidadRegistros > 0) {
                    resultadosImportados.forEach(resultado => {
                        tablaDatos.row.add([
                            resultado.fecha,
                            `${resultado.kilometros.toFixed(2)} km`,
                            `${resultado.litros.toFixed(2)} L`,
                            `${resultado.consumo.toFixed(2)} L cada 100km`,
                            '<button class="btn btn-danger btn-sm btn-borrar"><i class="fa-sharp fa-solid fa-trash" style="color: #ffffff;"></i></button>'
                        ]).draw();
                        guardarResultadoLocalStorage([
                            resultado.fecha,
                            resultado.kilometros.toFixed(2),
                            resultado.litros.toFixed(2),
                            resultado.consumo.toFixed(2)
                        ]);
                    });
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
        resultadosGuardados.push({
            fecha: resultado[0],
            kilometros: parseFloat(resultado[1]),
            litros: parseFloat(resultado[2]),
            consumo: parseFloat(resultado[3])
        });
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
        tablaDatos.row.add([
            resultado.fecha,
            `${resultado.kilometros.toFixed(2)} km`,
            `${resultado.litros.toFixed(2)} L`,
            `${resultado.consumo.toFixed(2)} L cada 100km`,
            '<button class="btn btn-danger btn-sm btn-borrar"><i class="fa-sharp fa-solid fa-trash" style="color: #ffffff;"></i></button>'
        ]).draw();
    });

    $("#promedioBtn").on("click", function () {
        const resultadosGuardados = JSON.parse(localStorage.getItem("resultados")) || [];
        const promedioModalBody = $("#promedioModalBody");

        if (resultadosGuardados.length === 0) {
            promedioModalBody.html("No hay datos disponibles para calcular el promedio.");
        } else {
            let totalConsumo = 0;
            let totalKilometros = 0;
            let totalLitros = 0;

            resultadosGuardados.forEach(resultado => {
                totalConsumo += resultado.consumo;
                totalKilometros += resultado.kilometros;
                totalLitros += resultado.litros;
            });

            const promedioConsumo = totalConsumo / resultadosGuardados.length;
            const promedioKilometros = totalKilometros / resultadosGuardados.length;
            const promedioLitros = totalLitros / resultadosGuardados.length;

            const contenidoModal = `
                <p>✓ Consumo cada 100 km: <span class="text-success fw-bold text-opacity-75">${promedioConsumo.toFixed(2)} L</span>.</p>
                <p>✓ Recorrido entre recargas: <span class="text-success fw-bold text-opacity-75">${promedioKilometros.toFixed(2)} km</span>.</p>
                <p>✓ Carga al repostar: <span class="text-success fw-bold text-opacity-75">${promedioLitros.toFixed(2)} L</span>.</p>
            `;
            promedioModalBody.html(contenidoModal);
        }
        $("#promedioModal").modal("show");
    });

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