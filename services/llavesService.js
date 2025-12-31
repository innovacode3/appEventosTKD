const fs = require('fs');
const path = require('path');

function loadTemplate(numCompetitors) {
    try {
        const templatePath = path.join(__dirname, '../templates', `template${numCompetitors}.js`);

        if (!fs.existsSync(templatePath)) {
            console.error(`El archivo ${templatePath} no existe.`);
            return null;
        }

        delete require.cache[require.resolve(templatePath)]; // Forzar recarga
        return require(templatePath);
    } catch (error) {
        console.error("Error al cargar el template:", error);
        return null;
    }
}

function replaceNames(node, competitors) {
    // Mapear los marcadores ("P1", "P2", etc.) con los competidores reales
    const placeholders = {};
    competitors.forEach((nombre, index) => {
        placeholders[`P${index + 1}`] = nombre;
    });

    function assignNames(node) {
        if (placeholders[node.text.name]) {
            node.text.name = placeholders[node.text.name]; // Reemplaza P1, P2, etc.
        }

        if (node.children) {
            node.children.forEach(child => assignNames(child));
        }
    }

    assignNames(node);
}

function generateTournamentTree(competitors) {
    const numCompetitors = competitors.length;
    const template = loadTemplate(numCompetitors);

    if (!template) return null;

    replaceNames(template.nodeStructure, competitors);
    return template;
}

module.exports = { generateTournamentTree };
