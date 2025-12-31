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
            name: " ",
			desc: "4"
        },
        HTMLclass: "winner",
        children: [
			{
				text: {
					name: " ",
					desc: "3"
				},
				HTMLclass: "nivel-base",
				children: [
					{
						text: {
							name: " ",
							desc: " "
						},
						children: [
							{
								text: { 
									name: "P1",
									title: 1
								},
								HTMLclass: "first-draw"
							},
							{
								text: { 
									name: "Bye",
									
								},
								HTMLclass: "first-draw-bye"
							}
						]
					},
					{
						text: {
							name: " ",
							desc: "1"
						},
						children: [
							{
								text: { 
									name: "P5",
									title: 5
								},
								HTMLclass: "first-draw"
							},
							{
								text: { 
									name: "P4",
									title: 4
								},
								HTMLclass: "first-draw"
							}
						]
					}
				]
			},
			
			{
				text: {
					name: " ",
					desc: "2"
				},
				HTMLclass: "nivel-base",
				children: [
					{
						text: { 
							name: "P3",
							title: 3
						},
						HTMLclass: "first-draw"
					},
					{
						text: { 
							name: "P2",
							title: 2
						},
						HTMLclass: "first-draw"
					}
				]
			}
        ]
    }
}