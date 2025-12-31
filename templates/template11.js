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
			desc: "10"
        },
        HTMLclass: "winner",
        children: [
			{
				text: {
					name: " ",
					desc: "8"
				},
				HTMLclass: "nivel-base",
				children: [
					{
						text: {
							name: " ",
							desc: "5"
						},
						HTMLclass: "nivel-base",
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
									name: " ",
									desc: "1"
									
								},
								children: [
									{
										text: { 
											name: "P9",
											title: 9
										},
										HTMLclass: "first-draw"
									},
									{
										text: { 
											name: "P8",
											title: 8
											
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
							desc: "4"
						},
						HTMLclass: "nivel-base",
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
					desc: "9"
				},
				HTMLclass: "nivel-base",
				children: [
					{
						text: {
							name: " ",
							desc: "6"
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
									name: " ",
									desc: "2"
									
								},
								children: [
									{
										text: { 
											name: "P11",
											title: 11
										},
										HTMLclass: "first-draw"
									},
									{
										text: { 
											name: "P6",
											title: 6
											
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
							desc: "7"
						},
						HTMLclass: "nivel-base",
						children: [
							{
								text: { 
									name: " ",
									desc: "3"
									
								},
								children: [
									{
										text: { 
											name: "P7",
											title: 7
										},
										HTMLclass: "first-draw"
									},
									{
										text: { 
											name: "P10",
											title: 10
											
										},
										HTMLclass: "first-draw"
									}
								]
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
        ]
    }
}