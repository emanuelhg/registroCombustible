$(document).ready(function () {
    const STORAGE_KEY = "resultados";

    const registroForm = $("#registroForm");
    const borrarTodoBtn = $("#borrarTodoBtn");
    const confirmarBorradoBtn = $("#confirmarBorrado");
    const promedioBtn = $("#promedioBtn");
    const exportarBtn = $("#exportarBtn");
    const importarInput = $("#importarInput");
    const kilometrosInput = $("#kilometros");
    const litrosInput = $("#litros");
    const fechaInput = $("#fecha");
    const formFeedback = $("#formFeedback");
    const editForm = $("#editForm");
    const editIdInput = $("#editId");
    const editKilometrosInput = $("#editKilometros");
    const editLitrosInput = $("#editLitros");
    const editFechaInput = $("#editFecha");
    const editFormFeedback = $("#editFormFeedback");

    const statConsumo = $("#statConsumo");
    const statKm = $("#statKm");
    const statLitros = $("#statLitros");

    let chartInstance = null;

    const tablaDatos = $("#tablaDatos").DataTable({
        paging: true,
        pageLength: 7,
        responsive: true,
        autoWidth: false,
        order: [[0, "desc"]],
        language: {
            processing: "Procesando...",
            lengthMenu: "Mostrar _MENU_",
            zeroRecords: "No se encontraron registros",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            emptyTable: "Todavía no cargaste recargas.",
            infoEmpty: "Sin registros",
            infoFiltered: "(filtrado de _MAX_ registros)",
            search: "Buscar:",
            loadingRecords: "Cargando...",
            paginate: {
                first: "Primero",
                last: "Último",
                next: "Siguiente",
                previous: "Anterior"
            }
        },
        columns: [
            {
                title: "Fecha",
                render: function (data, type) {
                    if (type === "display") {
                        return formatDateDisplay(data);
                    }
                    return data;
                }
            },
            { title: "Kilómetros" },
            { title: "Litros" },
            { title: "Consumo" },
            { title: "Acción", orderable: false, searchable: false }
        ]
    });

    function getModalInstance(modalId) {
        const modalEl = document.getElementById(modalId);
        return bootstrap.Modal.getOrCreateInstance(modalEl);
    }

    function showAlert(title, message) {
        $("#alertModalLabel").text(title);
        $("#alertModalMessage").text(message);
        getModalInstance("alertModal").show();
    }

    function setFormFeedback(message, type = "error") {
        formFeedback.removeClass("feedback-success feedback-error");
        formFeedback.addClass(type === "success" ? "feedback-success" : "feedback-error");
        formFeedback.text(message);
    }

    function clearFormFeedback() {
        formFeedback.removeClass("feedback-success feedback-error");
        formFeedback.text("");
    }

    function setEditFormFeedback(message, type = "error") {
        editFormFeedback.removeClass("feedback-success feedback-error");
        editFormFeedback.addClass(type === "success" ? "feedback-success" : "feedback-error");
        editFormFeedback.text(message);
    }

    function clearEditFormFeedback() {
        editFormFeedback.removeClass("feedback-success feedback-error");
        editFormFeedback.text("");
    }

    function loadRecords() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    function saveRecords(records) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }

    function parseNumberInput(value) {
        const normalized = String(value).replace(",", ".").trim();
        return parseFloat(normalized);
    }

    function formatDateDisplay(isoDate) {
        if (!isoDate || typeof isoDate !== "string") {
            return "-";
        }

        const parts = isoDate.split("-");
        if (parts.length !== 3) {
            return isoDate;
        }

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function isValidDateString(value) {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }

        const date = new Date(`${value}T00:00:00`);
        return !Number.isNaN(date.getTime());
    }

    function isValidRecord(record) {
        return (
            Number.isFinite(record.kilometros) &&
            record.kilometros > 0 &&
            Number.isFinite(record.litros) &&
            record.litros > 0 &&
            Number.isFinite(record.consumo) &&
            record.consumo > 0 &&
            isValidDateString(record.fecha)
        );
    }

    function getNextId(records) {
        const maxId = records.reduce((max, record) => {
            const currentId = Number(record.id) || 0;
            return currentId > max ? currentId : max;
        }, 0);

        return maxId + 1;
    }

    function toTableRow(record) {
        const displayDate = formatDateDisplay(record.fecha);
        return [
            record.fecha,
            `${record.kilometros.toFixed(2)} km`,
            `${record.litros.toFixed(2)} L`,
            `${record.consumo.toFixed(2)} L/100 km`,
            `<div class="row-actions d-flex gap-2 flex-wrap">
                <button class="btn btn-outline-primary btn-sm btn-editar" data-id="${record.id}" type="button" aria-label="Editar registro del ${displayDate}">Editar</button>
                <button class="btn btn-outline-danger btn-sm btn-borrar" data-id="${record.id}" type="button" aria-label="Borrar registro del ${displayDate}">Borrar</button>
            </div>`
        ];
    }

    function renderTable(records) {
        tablaDatos.clear();
        records.forEach((record) => {
            tablaDatos.row.add(toTableRow(record));
        });
        tablaDatos.draw();
    }

    function calculateAverages(records) {
        if (!records.length) {
            return {
                consumo: null,
                kilometros: null,
                litros: null
            };
        }

        const total = records.reduce(
            (acc, record) => {
                acc.consumo += record.consumo;
                acc.kilometros += record.kilometros;
                acc.litros += record.litros;
                return acc;
            },
            { consumo: 0, kilometros: 0, litros: 0 }
        );

        return {
            consumo: total.consumo / records.length,
            kilometros: total.kilometros / records.length,
            litros: total.litros / records.length
        };
    }

    function renderStats(records) {
        const averages = calculateAverages(records);

        statConsumo.text(averages.consumo ? `${averages.consumo.toFixed(2)} L/100 km` : "-");
        statKm.text(averages.kilometros ? `${averages.kilometros.toFixed(1)} km` : "-");
        statLitros.text(averages.litros ? `${averages.litros.toFixed(2)} L` : "-");
    }

    function openPromedioModal(records) {
        const promedioModalBody = $("#promedioModalBody");

        if (!records.length) {
            promedioModalBody.text("No hay datos disponibles para calcular promedios.");
            getModalInstance("promedioModal").show();
            return;
        }

        const ordered = [...records].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        const averages = calculateAverages(ordered);

        const content = `
            <div class="mb-4">
                <p class="mb-2"><strong>Consumo promedio:</strong> ${averages.consumo.toFixed(2)} L/100 km</p>
                <p class="mb-2"><strong>Recorrido promedio:</strong> ${averages.kilometros.toFixed(2)} km</p>
                <p class="mb-0"><strong>Carga promedio:</strong> ${averages.litros.toFixed(2)} L</p>
            </div>
            <div>
                <canvas id="graficoBarras"></canvas>
            </div>
        `;

        promedioModalBody.html(content);

        const ctx = document.getElementById("graficoBarras");
        const labels = ordered.map((item) => formatDateDisplay(item.fecha));
        const consumoData = ordered.map((item) => Number(item.consumo.toFixed(2)));
        const minConsumo = Math.min(...consumoData);
        const maxConsumo = Math.max(...consumoData);
        const span = maxConsumo - minConsumo;
        const padding = span === 0 ? 0.25 : Math.max(0.12, span * 0.25);
        const yMin = Number((minConsumo - padding).toFixed(2));
        const yMax = Number((maxConsumo + padding).toFixed(2));
        const stepSize = span === 0 ? 0.1 : Number((Math.max(0.05, span / 5)).toFixed(2));

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Consumo (L/100 km)",
                        data: consumoData,
                        fill: true,
                        tension: 0.3,
                        borderColor: "#1769ff",
                        backgroundColor: "rgba(23, 105, 255, 0.15)",
                        pointBackgroundColor: "#1769ff",
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${Number(context.parsed.y).toFixed(2)} L/100 km`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: yMin,
                        max: yMax,
                        ticks: {
                            stepSize,
                            callback: function (value) {
                                return `${Number(value).toFixed(2)}`;
                            }
                        },
                        grid: {
                            color: "rgba(71, 85, 105, 0.22)"
                        },
                        title: {
                            display: true,
                            text: "L/100 km"
                        }
                    },
                    x: {
                        grid: {
                            color: "rgba(148, 163, 184, 0.14)"
                        },
                        title: {
                            display: true,
                            text: "Fecha"
                        }
                    }
                }
            }
        });

        getModalInstance("promedioModal").show();
    }

    function normalizeImportedRecord(rawRecord, id) {
        const fecha = typeof rawRecord.fecha === "string" ? rawRecord.fecha.slice(0, 10) : "";
        const kilometros = parseNumberInput(rawRecord.kilometros);
        const litros = parseNumberInput(rawRecord.litros);

        if (!Number.isFinite(kilometros) || !Number.isFinite(litros) || kilometros <= 0 || litros <= 0 || !isValidDateString(fecha)) {
            return null;
        }

        const consumo = (litros * 100) / kilometros;
        const normalized = { id, fecha, kilometros, litros, consumo };
        return isValidRecord(normalized) ? normalized : null;
    }

    function getTimestamp() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        return `${day}_${month}_${year}_${hours}_${minutes}`;
    }

    registroForm.on("submit", function (event) {
        event.preventDefault();

        const fecha = String(fechaInput.val() || "").trim();
        const kilometros = parseNumberInput(kilometrosInput.val());
        const litros = parseNumberInput(litrosInput.val());

        if (!isValidDateString(fecha) || !Number.isFinite(kilometros) || !Number.isFinite(litros) || kilometros <= 0 || litros <= 0) {
            setFormFeedback("Completá los campos con valores válidos: kilómetros y litros deben ser mayores a 0.", "error");
            return;
        }

        const records = loadRecords();
        const record = {
            id: getNextId(records),
            fecha,
            kilometros,
            litros,
            consumo: (litros * 100) / kilometros
        };

        records.push(record);
        saveRecords(records);
        renderTable(records);
        renderStats(records);
        registroForm[0].reset();
        fechaInput.val(new Date().toISOString().slice(0, 10));
        setFormFeedback("Registro agregado correctamente.", "success");
        kilometrosInput.trigger("focus");
    });

    borrarTodoBtn.on("click", function () {
        clearFormFeedback();
        const records = loadRecords();
        if (!records.length) {
            showAlert("Sin registros", "No hay registros para borrar.");
            return;
        }

        getModalInstance("confirmModal").show();
    });

    confirmarBorradoBtn.on("click", function () {
        saveRecords([]);
        renderTable([]);
        renderStats([]);
        getModalInstance("confirmModal").hide();
    });

    $("#tablaDatos tbody").on("click", ".btn-borrar", function () {
        const id = Number($(this).data("id"));
        if (!Number.isFinite(id)) {
            return;
        }

        const records = loadRecords();
        const nextRecords = records.filter((record) => Number(record.id) !== id);

        if (nextRecords.length === records.length) {
            showAlert("Registro no encontrado", "No se pudo eliminar el registro seleccionado.");
            return;
        }

        saveRecords(nextRecords);
        renderTable(nextRecords);
        renderStats(nextRecords);
    });

    $("#tablaDatos tbody").on("click", ".btn-editar", function () {
        clearEditFormFeedback();
        const id = Number($(this).data("id"));
        if (!Number.isFinite(id)) {
            return;
        }

        const records = loadRecords();
        const record = records.find((item) => Number(item.id) === id);
        if (!record) {
            showAlert("Registro no encontrado", "No se encontró el registro para editar.");
            return;
        }

        editIdInput.val(record.id);
        editKilometrosInput.val(record.kilometros);
        editLitrosInput.val(record.litros);
        editFechaInput.val(record.fecha);
        getModalInstance("editModal").show();
    });

    editForm.on("submit", function (event) {
        event.preventDefault();
        clearEditFormFeedback();

        const id = Number(editIdInput.val());
        const kilometros = parseNumberInput(editKilometrosInput.val());
        const litros = parseNumberInput(editLitrosInput.val());
        const fecha = String(editFechaInput.val() || "").trim();

        if (!Number.isFinite(id) || !isValidDateString(fecha) || !Number.isFinite(kilometros) || !Number.isFinite(litros) || kilometros <= 0 || litros <= 0) {
            setEditFormFeedback("Completá los campos con valores válidos.", "error");
            return;
        }

        const records = loadRecords();
        const index = records.findIndex((item) => Number(item.id) === id);
        if (index === -1) {
            setEditFormFeedback("No se encontró el registro para actualizar.", "error");
            return;
        }

        records[index] = {
            id,
            fecha,
            kilometros,
            litros,
            consumo: (litros * 100) / kilometros
        };

        saveRecords(records);
        renderTable(records);
        renderStats(records);
        getModalInstance("editModal").hide();
        setFormFeedback("Registro actualizado correctamente.", "success");
    });

    exportarBtn.on("click", function () {
        clearFormFeedback();
        const records = loadRecords();
        if (!records.length) {
            showAlert("Sin datos para exportar", "No hay registros para exportar en este momento.");
            return;
        }

        const payload = JSON.stringify(records, null, 2);
        const filename = `registros_combustible_${getTimestamp()}.json`;

        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        showAlert("Exportación completa", `Se exportaron ${records.length} registro(s) en ${filename}.`);
    });

    importarInput.on("change", function (event) {
        clearFormFeedback();
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function (loadEvent) {
            try {
                const parsed = JSON.parse(loadEvent.target.result);
                if (!Array.isArray(parsed)) {
                    showAlert("Importación inválida", "El archivo debe contener un arreglo de registros.");
                    return;
                }

                const records = loadRecords();
                let nextId = getNextId(records);
                let imported = 0;
                let skipped = 0;

                parsed.forEach((item) => {
                    const normalized = normalizeImportedRecord(item, nextId);
                    if (!normalized) {
                        skipped += 1;
                        return;
                    }

                    records.push(normalized);
                    nextId += 1;
                    imported += 1;
                });

                saveRecords(records);
                renderTable(records);
                renderStats(records);

                if (!imported) {
                    showAlert("Importación finalizada", "No se pudieron importar registros válidos.");
                } else {
                    showAlert("Importación finalizada", `Se importaron ${imported} registro(s). Omitidos: ${skipped}.`);
                }
            } catch (error) {
                showAlert("Error de importación", "No se pudo leer el archivo JSON seleccionado.");
            } finally {
                importarInput.val("");
            }
        };

        reader.readAsText(file);
    });

    promedioBtn.on("click", function () {
        clearFormFeedback();
        openPromedioModal(loadRecords());
    });

    const initialRecords = loadRecords().filter(isValidRecord);
    const today = new Date().toISOString().slice(0, 10);
    fechaInput.attr("max", today);
    fechaInput.val(today);
    editFechaInput.attr("max", today);
    saveRecords(initialRecords);
    renderTable(initialRecords);
    renderStats(initialRecords);
});
