module.exports = {
    chart: {
        container: "#OrganiseChart",
        levelSeparation: 20,
        siblingSeparation: 2,
        subTeeSeparation: 2,
        rootOrientation: "EAST",
        node: {
            HTMLclass: "tennis-draw",
            drawLineThrough: true
        },
        connectors: {
            type: "step",
            style: {
                "stroke-width": 2,
                "stroke": "#ccc"
            }
        }
    },
    nodeStructure: {
        text: {
            /*name: "P1",*/
            desc: "0"
        },
        HTMLclass: "winner",
        children:[
            {
                text: {
                    name: "P1",
                    title: "1"
                },
                HTMLclass: "first-draw"
            }
        ]
    }
}
