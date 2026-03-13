$(document).ready(function () {
    const STORAGE_KEY = "resultados";

    const registroForm = $("#registroForm");
    const limpiarCargaBtn = $("#limpiarCargaBtn");
    const borrarTodoBtn = $("#borrarTodoBtn");
    const confirmarBorradoBtn = $("#confirmarBorrado");
    const promedioBtn = $("#promedioBtn");
    const exportarBtn = $("#exportarBtn");
    const importarInput = $("#importarInput");

    const estacionInput = $("#estacion");
    const estacionesSugeridas = $("#estacionesSugeridas");
    const stationCatalogStatus = $("#stationCatalogStatus");
    const filtroProvinciaInput = $("#filtroProvincia");
    const filtroCiudadInput = $("#filtroCiudad");
    const filtroBanderaInput = $("#filtroBandera");
    const combustibleInput = $("#combustible");
    const kilometrosInput = $("#kilometros");
    const litrosInput = $("#litros");
    const precioLitroInput = $("#precioLitro");
    const priceAutoStatus = $("#priceAutoStatus");
    const gastoTotalInput = $("#gastoTotal");
    const fechaInput = $("#fecha");
    const formFeedback = $("#formFeedback");

    const editForm = $("#editForm");
    const editIdInput = $("#editId");
    const editEstacionInput = $("#editEstacion");
    const editCombustibleInput = $("#editCombustible");
    const editKilometrosInput = $("#editKilometros");
    const editLitrosInput = $("#editLitros");
    const editPrecioLitroInput = $("#editPrecioLitro");
    const editPriceAutoStatus = $("#editPriceAutoStatus");
    const editGastoTotalInput = $("#editGastoTotal");
    const editFechaInput = $("#editFecha");
    const editFormFeedback = $("#editFormFeedback");

    const statConsumo = $("#statConsumo");
    const statKm = $("#statKm");
    const statLitros = $("#statLitros");
    const statGasto = $("#statGasto");

    let chartInstance = null;
    let stationCatalog = [];
    let stationPriceTimeline = {};
    let lastAutoPriceMain = null;
    let lastAutoPriceEdit = null;

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
            emptyTable: "Todavía no hay registros.",
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
            { title: "Estación" },
            { title: "Combustible" },
            { title: "Kilómetros" },
            { title: "Litros" },
            { title: "Precio/L" },
            { title: "Gasto total" },
            { title: "Consumo" },
            { title: "Acción", orderable: false, searchable: false }
        ],
        columnDefs: [
            { targets: [5, 6], className: "text-center", responsivePriority: 6 },
            { targets: 1, responsivePriority: 5 },
            { targets: 2, responsivePriority: 4 },
            { targets: 3, responsivePriority: 3 },
            { targets: 4, responsivePriority: 2 },
            { targets: 7, responsivePriority: 1 },
            { targets: 8, responsivePriority: 1 }
        ]
    });

    function round2(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }

    function parseNumberInput(value) {
        const normalized = String(value ?? "").replace(",", ".").trim();
        return parseFloat(normalized);
    }

    function normalizeText(value) {
        return String(value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function getBrandDisplay(station) {
        const raw = normalizeText(station?.brand || "");
        const fullText = `${raw} ${normalizeText(station?.name || "")}`;

        if (fullText.includes("ypf")) return "YPF";
        if (fullText.includes("shell")) return "Shell";
        if (fullText.includes("axion")) return "Axion Energy";
        if (fullText.includes("puma")) return "Puma Energy";
        if (fullText.includes("petronas")) return "Petronas";
        if (fullText.includes("esso")) return "Esso";
        if (fullText.includes("refinor")) return "Refinor";
        if (fullText.includes("voa")) return "VOA";
        if (fullText.includes("dapsa")) return "DAPSA";
        if (fullText.includes("gulf")) return "Gulf";
        if (fullText.includes("oil combustibles")) return "Oil";
        if (fullText.includes("blanca") || fullText.includes("sin bandera")) return "Sin bandera";

        return "Sin bandera";
    }

    function isPositiveNumber(value) {
        return Number.isFinite(value) && value > 0;
    }

    function isFiniteDate(dateValue) {
        return dateValue instanceof Date && !Number.isNaN(dateValue.getTime());
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

    function formatCurrencyArs(value) {
        if (!isPositiveNumber(value)) {
            return "-";
        }

        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 2
        }).format(value);
    }

    function setAutoPriceStatus($target, message, tone = "neutral") {
        $target.removeClass("feedback-success feedback-error price-hint-neutral");
        if (tone === "success") {
            $target.addClass("feedback-success");
        } else if (tone === "error") {
            $target.addClass("feedback-error");
        } else {
            $target.addClass("price-hint-neutral");
        }
        $target.text(message);
    }

    function getFuelKeyCandidates(fuelType) {
        const value = String(fuelType || "").trim();
        if (!value) {
            return [];
        }

        const norm = normalizeText(value);
        const keys = new Set([value]);

        if (norm === "diesel") {
            keys.add("Gas Oil Grado 2");
            keys.add("Gasoil Grado 2");
            keys.add("Diesel");
        } else if (norm === "diesel premium") {
            keys.add("Gas Oil Grado 3");
            keys.add("Gasoil Grado 3");
            keys.add("Diesel Premium");
        } else if (norm === "nafta super") {
            keys.add("Nafta Super");
        } else if (norm === "nafta premium") {
            keys.add("Nafta Premium");
        } else if (norm === "gnc") {
            keys.add("GNC");
        }

        return Array.from(keys);
    }

    function sanitizeCatalogStation(entry) {
        if (!entry || typeof entry !== "object") {
            return null;
        }

        const name = String(entry.name ?? "").trim();
        const brand = String(entry.brand ?? "").trim();
        const city = String(entry.city ?? "").trim();
        const province = String(entry.province ?? "").trim();
        const fuels = Array.isArray(entry.fuels) ? entry.fuels.map((fuel) => String(fuel).trim()).filter(Boolean) : [];

        if (!name || !brand || !fuels.length) {
            return null;
        }

        return { name, brand, city, province, fuels };
    }

    function loadStationCatalog() {
        const rawCatalog = Array.isArray(window.STATIONS_CATALOG) ? window.STATIONS_CATALOG : [];
        stationCatalog = rawCatalog.map(sanitizeCatalogStation).filter(Boolean);

        const rawTimeline = window.STATION_PRICE_TIMELINE && typeof window.STATION_PRICE_TIMELINE === "object"
            ? window.STATION_PRICE_TIMELINE
            : {};

        stationPriceTimeline = rawTimeline;
        return stationCatalog;
    }

    function buildStationLabel(station) {
        const location = [station.city, station.province].filter(Boolean).join(", ");
        const brandDisplay = getBrandDisplay(station);
        const base = brandDisplay ? `${brandDisplay} - ${station.name}` : station.name;
        return location ? `${base} (${location})` : base;
    }

    function uniqueSorted(values) {
        return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }

    function getMainStationFilters() {
        return {
            province: String(filtroProvinciaInput.val() || "").trim(),
            city: String(filtroCiudadInput.val() || "").trim(),
            brand: String(filtroBanderaInput.val() || "").trim(),
            fuel: String(combustibleInput.val() || "").trim()
        };
    }

    function filterStations(filters = {}) {
        const provinceNorm = normalizeText(filters.province || "");
        const cityNorm = normalizeText(filters.city || "");
        const brandNorm = normalizeText(filters.brand || "");
        const fuel = String(filters.fuel || "").trim();

        return stationCatalog.filter((station) => {
            if (provinceNorm && normalizeText(station.province) !== provinceNorm) return false;
            if (cityNorm && normalizeText(station.city) !== cityNorm) return false;
            if (brandNorm && normalizeText(getBrandDisplay(station)) !== brandNorm) return false;
            if (fuel && !station.fuels.includes(fuel)) return false;
            return true;
        });
    }

    function fillSelectOptions($select, values, defaultLabel = "Todas") {
        const current = String($select.val() || "");
        $select.empty();
        $select.append(`<option value="">${defaultLabel}</option>`);
        values.forEach((value) => {
            $select.append(`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`);
        });

        if (current && values.includes(current)) {
            $select.val(current);
        } else {
            $select.val("");
        }
    }

    function renderLocationBrandFilters() {
        const filters = getMainStationFilters();
        const provinces = uniqueSorted(stationCatalog.map((s) => s.province));
        fillSelectOptions(filtroProvinciaInput, provinces, "Todas");

        const byProvince = stationCatalog.filter((s) => {
            if (!filters.province) return true;
            return normalizeText(s.province) === normalizeText(filters.province);
        });

        const byProvinceBrand = byProvince.filter((s) => {
            if (!filters.brand) return true;
            return normalizeText(getBrandDisplay(s)) === normalizeText(filters.brand);
        });

        const cities = uniqueSorted(byProvinceBrand.map((s) => s.city));
        fillSelectOptions(filtroCiudadInput, cities, "Todas");

        const brandValues = uniqueSorted(byProvince.map((s) => getBrandDisplay(s)));
        fillSelectOptions(filtroBanderaInput, brandValues, "Todas");
    }

    function renderStationDatalist(fuelFilter = "", useMainFilters = true) {
        const list = useMainFilters
            ? filterStations({ ...getMainStationFilters(), fuel: fuelFilter })
            : filterStations({ fuel: fuelFilter });

        const fuel = String(fuelFilter || "").trim();
        const finalList = fuel ? list.filter((station) => station.fuels.includes(fuel)) : list;

        estacionesSugeridas.empty();

        finalList
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((station) => {
                const option = document.createElement("option");
                option.value = buildStationLabel(station);
                estacionesSugeridas.append(option);
            });

        return finalList.length;
    }

    function refreshMainStationSearch() {
        renderLocationBrandFilters();
        const total = renderStationDatalist(combustibleInput.val(), true);
        stationCatalogStatus.text(`Catálogo activo: ${stationCatalog.length} estaciones. Coincidencias actuales: ${total}.`);
    }

    function findStationByInput(rawInput, candidates = stationCatalog) {
        const input = normalizeText(rawInput);
        if (!input) {
            return null;
        }

        const exact = candidates.find(
            (station) =>
                normalizeText(station.name) === input ||
                normalizeText(buildStationLabel(station)) === input
        );
        if (exact) {
            return exact;
        }

        return (
            candidates.find(
                (station) =>
                    normalizeText(buildStationLabel(station)).includes(input) ||
                    normalizeText(station.name).includes(input) ||
                    normalizeText(station.city).includes(input) ||
                    normalizeText(station.province).includes(input)
            ) || null
        );
    }

    function resolveStationDisplay(rawInput, useMainFilters = true) {
        const candidates = useMainFilters ? filterStations(getMainStationFilters()) : stationCatalog;
        const station = findStationByInput(rawInput, candidates);
        if (!station) {
            return String(rawInput || "").trim();
        }
        return buildStationLabel(station);
    }

    function findApproxPrice(station, fuelType) {
        if (!station || !fuelType) {
            return null;
        }

        const timeline = Array.isArray(stationPriceTimeline[station.brand]) ? stationPriceTimeline[station.brand] : [];
        if (!timeline.length) {
            return null;
        }

        const fuelCandidates = getFuelKeyCandidates(fuelType);
        const matches = timeline
            .map((point) => {
                const pointDate = new Date(`${point.date}T00:00:00`);
                const prices = point && point.prices ? point.prices : {};
                let price = null;

                for (const candidate of fuelCandidates) {
                    if (isPositiveNumber(prices[candidate])) {
                        price = prices[candidate];
                        break;
                    }
                }

                if (!isFiniteDate(pointDate) || !isPositiveNumber(price)) {
                    return null;
                }
                return {
                    pointDate,
                    pointDateIso: point.date,
                    price
                };
            })
            .filter(Boolean);

        if (!matches.length) {
            return null;
        }

        // Vigentes: usar la referencia mas reciente para marca+combustible.
        matches.sort((a, b) => b.pointDate - a.pointDate);
        return matches[0];
    }

    function tryAutofillPriceMain(force = false) {
        const station = findStationByInput(estacionInput.val(), filterStations(getMainStationFilters()));
        const fuelType = String(combustibleInput.val() || "").trim();

        if (!station || !fuelType) {
            setAutoPriceStatus(priceAutoStatus, "Completá estación y combustible para sugerir precio vigente.");
            return;
        }

        const approx = findApproxPrice(station, fuelType);
        if (!approx) {
            setAutoPriceStatus(priceAutoStatus, "No hay referencia de precio para esa combinación en el catálogo.", "error");
            return;
        }

        const currentPrice = parseNumberInput(precioLitroInput.val());
        const userCustomized = isPositiveNumber(currentPrice) && (lastAutoPriceMain === null || Math.abs(currentPrice - lastAutoPriceMain) > 0.01);
        if (!force && userCustomized) {
            setAutoPriceStatus(priceAutoStatus, "Precio manual detectado. No se sobreescribió la sugerencia.");
            return;
        }

        const suggested = round2(approx.price);
        precioLitroInput.val(suggested.toFixed(2));
        lastAutoPriceMain = suggested;
        syncCostFields(litrosInput.val(), precioLitroInput.val(), gastoTotalInput.val(), "precio", precioLitroInput, gastoTotalInput);
        setAutoPriceStatus(
            priceAutoStatus,
            `Precio vigente sugerido: ${formatCurrencyArs(suggested)} (${station.brand}, fuente: datos.energia.gob.ar).`,
            "success"
        );
    }

    function tryAutofillPriceEdit(force = false) {
        const station = findStationByInput(editEstacionInput.val());
        const fuelType = String(editCombustibleInput.val() || "").trim();

        if (!station || !fuelType) {
            setAutoPriceStatus(editPriceAutoStatus, "");
            return;
        }

        const approx = findApproxPrice(station, fuelType);
        if (!approx) {
            setAutoPriceStatus(editPriceAutoStatus, "Sin referencia para esa combinación.", "error");
            return;
        }

        const currentPrice = parseNumberInput(editPrecioLitroInput.val());
        const userCustomized = isPositiveNumber(currentPrice) && (lastAutoPriceEdit === null || Math.abs(currentPrice - lastAutoPriceEdit) > 0.01);
        if (!force && userCustomized) {
            return;
        }

        const suggested = round2(approx.price);
        editPrecioLitroInput.val(suggested.toFixed(2));
        lastAutoPriceEdit = suggested;
        syncCostFields(editLitrosInput.val(), editPrecioLitroInput.val(), editGastoTotalInput.val(), "precio", editPrecioLitroInput, editGastoTotalInput);
        setAutoPriceStatus(
            editPriceAutoStatus,
            `Sugerido ${formatCurrencyArs(suggested)} (vigente, fuente: datos.energia.gob.ar).`,
            "success"
        );
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function deriveCosts(litros, precioLitro, gastoTotal) {
        const hasPrecio = isPositiveNumber(precioLitro);
        const hasGasto = isPositiveNumber(gastoTotal);

        if (!isPositiveNumber(litros)) {
            return { ok: false, message: "Los litros deben ser mayores a 0 para calcular gastos." };
        }

        if (!hasPrecio && !hasGasto) {
            return { ok: false, message: "Ingresá precio por litro o gasto total." };
        }

        let precio = precioLitro;
        let gasto = gastoTotal;

        if (hasPrecio && hasGasto) {
            const expected = round2(precio * litros);
            if (Math.abs(expected - gasto) > 1) {
                return { ok: false, message: "Precio por litro y gasto total no coinciden con los litros cargados." };
            }
            gasto = expected;
        } else if (hasPrecio) {
            gasto = round2(precio * litros);
        } else {
            precio = round2(gasto / litros);
        }

        return {
            ok: true,
            precioLitro: round2(precio),
            gastoTotal: round2(gasto)
        };
    }

    function getModalInstance(modalId) {
        const modalEl = document.getElementById(modalId);
        return bootstrap.Modal.getOrCreateInstance(modalEl);
    }

    function showAlert(title, message) {
        $("#alertModalLabel").text(title);
        $("#alertModalMessage").text(message);
        getModalInstance("alertModal").show();
    }

    function setFeedback($el, message, type = "error") {
        $el.removeClass("feedback-success feedback-error");
        $el.addClass(type === "success" ? "feedback-success" : "feedback-error");
        $el.text(message);
    }

    function clearFeedback($el) {
        $el.removeClass("feedback-success feedback-error");
        $el.text("");
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

    function getNextId(records) {
        const maxId = records.reduce((max, record) => {
            const currentId = Number(record.id) || 0;
            return currentId > max ? currentId : max;
        }, 0);

        return maxId + 1;
    }

    function sanitizeStoredRecord(rawRecord, fallbackId) {
        const fecha = typeof rawRecord.fecha === "string" ? rawRecord.fecha.slice(0, 10) : "";
        const kilometros = parseNumberInput(rawRecord.kilometros);
        const litros = parseNumberInput(rawRecord.litros);
        const consumo = parseNumberInput(rawRecord.consumo);

        if (!isValidDateString(fecha) || !isPositiveNumber(kilometros) || !isPositiveNumber(litros) || !isPositiveNumber(consumo)) {
            return null;
        }

        const estacion = typeof rawRecord.estacion === "string" ? rawRecord.estacion.trim() : "";
        const combustibleRaw = typeof rawRecord.combustible === "string" ? rawRecord.combustible.trim() : "";
        const combustible = combustibleRaw || "No especificado";

        let precioLitro = parseNumberInput(rawRecord.precioLitro ?? rawRecord.precio ?? rawRecord.precio_por_litro);
        let gastoTotal = parseNumberInput(rawRecord.gastoTotal ?? rawRecord.gasto ?? rawRecord.total);

        const hasPrecio = isPositiveNumber(precioLitro);
        const hasGasto = isPositiveNumber(gastoTotal);

        if (hasPrecio && !hasGasto) {
            gastoTotal = round2(precioLitro * litros);
        }

        if (hasGasto && !hasPrecio) {
            precioLitro = round2(gastoTotal / litros);
        }

        if (!isPositiveNumber(precioLitro)) {
            precioLitro = null;
        }

        if (!isPositiveNumber(gastoTotal)) {
            gastoTotal = null;
        }

        return {
            id: Number(rawRecord.id) || fallbackId,
            fecha,
            estacion,
            combustible,
            kilometros: round2(kilometros),
            litros: round2(litros),
            precioLitro,
            gastoTotal,
            consumo: round2(consumo)
        };
    }

    function isValidRecord(record) {
        const baseValid = (
            isPositiveNumber(record.kilometros) &&
            isPositiveNumber(record.litros) &&
            isPositiveNumber(record.consumo) &&
            isValidDateString(record.fecha) &&
            typeof record.combustible === "string" &&
            record.combustible.trim() !== ""
        );

        if (!baseValid) {
            return false;
        }

        const hasPrecio = isPositiveNumber(record.precioLitro);
        const hasGasto = isPositiveNumber(record.gastoTotal);

        return (hasPrecio && hasGasto) || (!hasPrecio && !hasGasto);
    }

    function toTableRow(record) {
        const displayDate = formatDateDisplay(record.fecha);
        const stationText = record.estacion && record.estacion.trim() ? record.estacion : "-";
        const stationTextSafe = escapeHtml(stationText);
        const fuelTextSafe = escapeHtml(record.combustible);

        return [
            record.fecha,
            `<span class="station-cell" title="${stationTextSafe}">${stationTextSafe}</span>`,
            `<span class="fuel-cell" title="${fuelTextSafe}">${fuelTextSafe}</span>`,
            `${record.kilometros.toFixed(2)} km`,
            `${record.litros.toFixed(2)} L`,
            formatCurrencyArs(record.precioLitro),
            formatCurrencyArs(record.gastoTotal),
            `${record.consumo.toFixed(2)} L/100 km`,
            `<div class="row-actions">
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
                litros: null,
                gasto: null
            };
        }

        const total = records.reduce(
            (acc, record) => {
                acc.consumo += record.consumo;
                acc.kilometros += record.kilometros;
                acc.litros += record.litros;
                if (isPositiveNumber(record.gastoTotal)) {
                    acc.gasto += record.gastoTotal;
                    acc.costCount += 1;
                }
                return acc;
            },
            { consumo: 0, kilometros: 0, litros: 0, gasto: 0, costCount: 0 }
        );

        return {
            consumo: total.consumo / records.length,
            kilometros: total.kilometros / records.length,
            litros: total.litros / records.length,
            gasto: total.costCount ? total.gasto / total.costCount : null
        };
    }

    function renderStats(records) {
        const averages = calculateAverages(records);

        statConsumo.text(averages.consumo ? `${averages.consumo.toFixed(2)} L/100 km` : "-");
        statKm.text(averages.kilometros ? `${averages.kilometros.toFixed(1)} km` : "-");
        statLitros.text(averages.litros ? `${averages.litros.toFixed(2)} L` : "-");
        statGasto.text(averages.gasto ? formatCurrencyArs(averages.gasto) : "-");
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
                <p class="mb-2"><strong>Carga promedio:</strong> ${averages.litros.toFixed(2)} L</p>
                <p class="mb-0"><strong>Gasto promedio:</strong> ${averages.gasto ? formatCurrencyArs(averages.gasto) : "Sin datos suficientes"}</p>
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

    function getTimestamp() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        return `${day}_${month}_${year}_${hours}_${minutes}`;
    }

    function syncCostFields(litersValue, priceValue, totalValue, source, $priceTarget, $totalTarget) {
        const litros = parseNumberInput(litersValue);
        const precio = parseNumberInput(priceValue);
        const gasto = parseNumberInput(totalValue);

        if (!isPositiveNumber(litros)) {
            return;
        }

        if (source === "precio" && isPositiveNumber(precio)) {
            $totalTarget.val(round2(precio * litros).toFixed(2));
            return;
        }

        if (source === "gasto" && isPositiveNumber(gasto)) {
            $priceTarget.val(round2(gasto / litros).toFixed(2));
            return;
        }

        if (source === "litros") {
            if (isPositiveNumber(precio)) {
                $totalTarget.val(round2(precio * litros).toFixed(2));
            } else if (isPositiveNumber(gasto)) {
                $priceTarget.val(round2(gasto / litros).toFixed(2));
            }
        }
    }

    function resetCurrentEntryForm() {
        filtroProvinciaInput.val("");
        filtroCiudadInput.val("");
        filtroBanderaInput.val("");
        estacionInput.val("");
        combustibleInput.val("");
        kilometrosInput.val("");
        litrosInput.val("");
        precioLitroInput.val("");
        gastoTotalInput.val("");
        fechaInput.val(new Date().toISOString().slice(0, 10));
        lastAutoPriceMain = null;
        setAutoPriceStatus(priceAutoStatus, "Completá estación y combustible para sugerir precio vigente.");
        refreshMainStationSearch();
    }

    registroForm.on("submit", function (event) {
        event.preventDefault();

        const fecha = String(fechaInput.val() || "").trim();
        const estacion = resolveStationDisplay(estacionInput.val(), true);
        const combustible = String(combustibleInput.val() || "").trim();
        const kilometros = parseNumberInput(kilometrosInput.val());
        const litros = parseNumberInput(litrosInput.val());
        const precioLitro = parseNumberInput(precioLitroInput.val());
        const gastoTotal = parseNumberInput(gastoTotalInput.val());

        if (!isValidDateString(fecha) || !isPositiveNumber(kilometros) || !isPositiveNumber(litros)) {
            setFeedback(formFeedback, "Completá fecha, kilómetros y litros con valores válidos.", "error");
            return;
        }

        if (!combustible) {
            setFeedback(formFeedback, "Seleccioná un tipo de combustible.", "error");
            return;
        }

        const costs = deriveCosts(litros, precioLitro, gastoTotal);
        if (!costs.ok) {
            setFeedback(formFeedback, costs.message, "error");
            return;
        }

        const records = loadRecords();
        const record = {
            id: getNextId(records),
            fecha,
            estacion,
            combustible,
            kilometros: round2(kilometros),
            litros: round2(litros),
            precioLitro: costs.precioLitro,
            gastoTotal: costs.gastoTotal,
            consumo: round2((litros * 100) / kilometros)
        };

        records.push(record);
        saveRecords(records);
        renderTable(records);
        renderStats(records);
        resetCurrentEntryForm();

        setFeedback(formFeedback, "Registro agregado correctamente.", "success");
        estacionInput.trigger("focus");
    });

    limpiarCargaBtn.on("click", function () {
        clearFeedback(formFeedback);
        resetCurrentEntryForm();
        setFeedback(formFeedback, "Campos de carga limpiados.", "success");
        estacionInput.trigger("focus");
    });

    borrarTodoBtn.on("click", function () {
        clearFeedback(formFeedback);
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
        clearFeedback(editFormFeedback);
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
        editEstacionInput.val(record.estacion || "");
        editCombustibleInput.val(record.combustible || "");
        editKilometrosInput.val(record.kilometros);
        editLitrosInput.val(record.litros);
        editPrecioLitroInput.val(isPositiveNumber(record.precioLitro) ? record.precioLitro.toFixed(2) : "");
        editGastoTotalInput.val(isPositiveNumber(record.gastoTotal) ? record.gastoTotal.toFixed(2) : "");
        editFechaInput.val(record.fecha);
        lastAutoPriceEdit = isPositiveNumber(record.precioLitro) ? record.precioLitro : null;
        tryAutofillPriceEdit(false);
        getModalInstance("editModal").show();
    });

    editForm.on("submit", function (event) {
        event.preventDefault();
        clearFeedback(editFormFeedback);

        const id = Number(editIdInput.val());
        const estacion = resolveStationDisplay(editEstacionInput.val(), false);
        const combustible = String(editCombustibleInput.val() || "").trim();
        const kilometros = parseNumberInput(editKilometrosInput.val());
        const litros = parseNumberInput(editLitrosInput.val());
        const precioLitro = parseNumberInput(editPrecioLitroInput.val());
        const gastoTotal = parseNumberInput(editGastoTotalInput.val());
        const fecha = String(editFechaInput.val() || "").trim();

        if (!Number.isFinite(id) || !isValidDateString(fecha) || !isPositiveNumber(kilometros) || !isPositiveNumber(litros)) {
            setFeedback(editFormFeedback, "Completá fecha, kilómetros y litros con valores válidos.", "error");
            return;
        }

        if (!combustible) {
            setFeedback(editFormFeedback, "Seleccioná un tipo de combustible.", "error");
            return;
        }

        const costs = deriveCosts(litros, precioLitro, gastoTotal);
        if (!costs.ok) {
            setFeedback(editFormFeedback, costs.message, "error");
            return;
        }

        const records = loadRecords();
        const index = records.findIndex((item) => Number(item.id) === id);
        if (index === -1) {
            setFeedback(editFormFeedback, "No se encontró el registro para actualizar.", "error");
            return;
        }

        records[index] = {
            id,
            fecha,
            estacion,
            combustible,
            kilometros: round2(kilometros),
            litros: round2(litros),
            precioLitro: costs.precioLitro,
            gastoTotal: costs.gastoTotal,
            consumo: round2((litros * 100) / kilometros)
        };

        saveRecords(records);
        renderTable(records);
        renderStats(records);
        getModalInstance("editModal").hide();
        setFeedback(formFeedback, "Registro actualizado correctamente.", "success");
    });

    exportarBtn.on("click", function () {
        clearFeedback(formFeedback);
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
        clearFeedback(formFeedback);
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
                    const sanitized = sanitizeStoredRecord(item, nextId);
                    if (!sanitized || !isValidRecord(sanitized)) {
                        skipped += 1;
                        return;
                    }

                    // Always assign a fresh id to avoid collisions with existing local records.
                    sanitized.id = nextId;
                    records.push(sanitized);
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
        clearFeedback(formFeedback);
        openPromedioModal(loadRecords());
    });

    litrosInput.on("input", function () {
        syncCostFields(litrosInput.val(), precioLitroInput.val(), gastoTotalInput.val(), "litros", precioLitroInput, gastoTotalInput);
    });

    precioLitroInput.on("input", function () {
        lastAutoPriceMain = null;
        syncCostFields(litrosInput.val(), precioLitroInput.val(), gastoTotalInput.val(), "precio", precioLitroInput, gastoTotalInput);
    });

    gastoTotalInput.on("input", function () {
        syncCostFields(litrosInput.val(), precioLitroInput.val(), gastoTotalInput.val(), "gasto", precioLitroInput, gastoTotalInput);
    });

    editLitrosInput.on("input", function () {
        syncCostFields(editLitrosInput.val(), editPrecioLitroInput.val(), editGastoTotalInput.val(), "litros", editPrecioLitroInput, editGastoTotalInput);
    });

    editPrecioLitroInput.on("input", function () {
        lastAutoPriceEdit = null;
        syncCostFields(editLitrosInput.val(), editPrecioLitroInput.val(), editGastoTotalInput.val(), "precio", editPrecioLitroInput, editGastoTotalInput);
    });

    editGastoTotalInput.on("input", function () {
        syncCostFields(editLitrosInput.val(), editPrecioLitroInput.val(), editGastoTotalInput.val(), "gasto", editPrecioLitroInput, editGastoTotalInput);
    });

    estacionInput.on("change blur", function () {
        tryAutofillPriceMain(false);
    });

    filtroProvinciaInput.on("change", function () {
        refreshMainStationSearch();
        tryAutofillPriceMain(false);
    });

    filtroBanderaInput.on("change", function () {
        refreshMainStationSearch();
        tryAutofillPriceMain(false);
    });

    filtroCiudadInput.on("change", function () {
        refreshMainStationSearch();
        tryAutofillPriceMain(false);
    });

    combustibleInput.on("change", function () {
        refreshMainStationSearch();
        tryAutofillPriceMain(false);
    });

    fechaInput.on("change", function () {
        tryAutofillPriceMain(false);
    });

    editEstacionInput.on("change blur", function () {
        tryAutofillPriceEdit(false);
    });

    editCombustibleInput.on("change", function () {
        renderStationDatalist(editCombustibleInput.val(), false);
        tryAutofillPriceEdit(false);
    });

    editFechaInput.on("change", function () {
        tryAutofillPriceEdit(false);
    });

    const initialRaw = loadRecords();
    const initialRecords = initialRaw
        .map((record, index) => sanitizeStoredRecord(record, index + 1))
        .filter((record) => record && isValidRecord(record))
        .map((record, index) => ({ ...record, id: index + 1 }));

    const today = new Date().toISOString().slice(0, 10);
    fechaInput.attr("max", today);
    fechaInput.val(today);
    editFechaInput.attr("max", today);

    const catalog = loadStationCatalog();
    if (catalog.length) {
        refreshMainStationSearch();
    } else {
        stationCatalogStatus.text("No se encontró catálogo local de estaciones.");
    }

    setAutoPriceStatus(priceAutoStatus, "Completá estación y combustible para sugerir precio vigente.");
    setAutoPriceStatus(editPriceAutoStatus, "");

    saveRecords(initialRecords);
    renderTable(initialRecords);
    renderStats(initialRecords);
});
