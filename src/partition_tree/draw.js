let d3ContentDiv, svgDiv, svg;
let n2ElementsGroup, n2GridLinesGroup, n2ComponentBoxesGroup, n2ArrowsGroup, n2DotsGroup;

let n2Group;
let arrowMarker;

let WIDTH_N2_PX = ptn2.HEIGHT_PX;
let PTREE_N2_GAP_PX = 10; //spacing between partition tree and n2 diagram
let n2Dx = 0, n2Dy = 0, n2Dx0 = 0, n2Dy0 = 0;
let d3NodesArray, d3RightTextNodesArrayZoomed = []
let d3RightTextNodesArrayZoomedBoxInfo
let drawableN2ComponentBoxes;
let matrix;

let gridLines;
let symbols_scalar,
    symbols_vector,
    symbols_group,
    symbols_scalarScalar,
    symbols_scalarVector,
    symbols_vectorScalar,
    symbols_vectorVector,
    symbols_scalarGroup,
    symbols_groupScalar,
    symbols_vectorGroup,
    symbols_groupVector,
    symbols_groupGroup;

let sharedTransition;
let FindRootOfChangeFunction = null;

let lastLeftClickedElement = document.getElementById("ptN2ContentDivId"),
    leftClickIsForward = true,
    lastClickWasLeft = true;

let enterIndex = 0,
    exitIndex = 0;

function DrawPathTwoLines(x1, y1, x2, y2, x3, y3, color, width, useArrow) {
    let path = n2ArrowsGroup.insert("path")
        .attr("class", "n2_hover_elements")
        .attr("d", "M" + x1 + " " + y1 + " L" + x2 + " " + y2 + " L" + x3 + " " + y3)
        .attr("fill", "none")
        .style("stroke-width", width)
        .style("stroke", color);

    n2DotsGroup.append("circle")
        .attr("class", "n2_hover_elements")
        .attr("cx", x2)
        .attr("cy", y2)
        .attr("r", width * 1.0)
        .style("stroke-width", 0)
        .style("fill-opacity", 1)
        .style("fill", "black");
    n2DotsGroup.append("circle")
        .attr("class", "n2_hover_elements")
        .attr("cx", x2)
        .attr("cy", y2)
        .attr("r", width * 1.0)
        .style("stroke-width", 0)
        .style("fill-opacity", .75)
        .style("fill", color);

    if (useArrow) {
        path.attr("marker-end", "url(#arrow)");
    }
}

function setD3ContentDiv() {
    d3ContentDiv = document.getElementById("ptN2ContentDivId").querySelector("#d3_content_div");
    svgDiv = d3.select(d3ContentDiv).append("div")
        .attr("class", "ptN2ChartClass");

    svg = svgDiv.append("svg:svg")
        .attr("id", "svgId");
}

function setN2Group() {
    n2Group = svg.append("g");
}

function setN2ElementsGroup() {
    n2ElementsGroup = n2Group.append("g");
    n2GridLinesGroup = n2Group.append("g");
    n2ComponentBoxesGroup = n2Group.append("g");
    n2ArrowsGroup = n2Group.append("g");
    n2DotsGroup = n2Group.append("g");
}

function DrawRect(x, y, width, height, fill) {
    n2Group.insert("rect")
        .attr("class", "n2_hover_elements")
        .attr("y", y)
        .attr("x", x)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", fill)
        .attr("fill-opacity", "1");
}

function DrawArrows(startIndex, endIndex) {
    let lineWidth = Math.min(5, n2Dx * .5, n2Dy * .5);
    arrowMarker.attr("markerWidth", lineWidth * .4)
        .attr("markerHeight", lineWidth * .4);

    let boxStart = d3RightTextNodesArrayZoomedBoxInfo[startIndex];
    let boxEnd = d3RightTextNodesArrayZoomedBoxInfo[endIndex];

    //draw multiple horizontal lines but no more than one vertical line for box to box connections
    let startIndices = [];
    for (let startsI = boxStart.startI; startsI <= boxStart.stopI; ++startsI) {
        for (let endsI = boxEnd.startI; endsI <= boxEnd.stopI; ++endsI) {
            if (matrix[startsI + "_" + endsI] !== undefined) { //if(matrix[startsI][endsI].z > 0){
                startIndices.push(startsI);
                break;
            }
        }
    }

    for (let i = 0; i < startIndices.length; ++i) {
        let startI = startIndices[i];
        let boxEndDelta = boxEnd.stopI - boxEnd.startI;

        if (startIndex < endIndex) { //right down arrow
            let x1 = (startI + 1) * n2Dx; //x1
            let x2 = (endIndex + boxEndDelta * .5) * n2Dx + n2Dx * .5; //right x2
            let x3 = x2; //down x3

            let y1 = startI * n2Dy + n2Dy * .5; //y1
            let y2 = y1; //right y2
            let y3 = endIndex * n2Dy; //down y3

            DrawPathTwoLines(x1, y1, x2, y2, x3, y3, ptn2.GREEN_ARROW_COLOR, lineWidth, true);
        }
        else if (startIndex > endIndex) { //left up arrow
            let x1 = startI * n2Dx; //x1
            let x2 = (endIndex + boxEndDelta * .5) * n2Dx + n2Dx * .5; //left x2
            let x3 = x2; //up x3

            let y1 = startI * n2Dy + n2Dy * .5; //y1
            let y2 = y1; //left y2
            let y3 = (endIndex + boxEndDelta + 1) * n2Dy; //y1

            DrawPathTwoLines(x1, y1, x2, y2, x3, y3, ptn2.RED_ARROW_COLOR, lineWidth, true);
        }
    }
}

function DrawArrowsParamView(startIndex, endIndex) {
    let lineWidth = Math.min(5, n2Dx * .5, n2Dy * .5);
    arrowMarker.attr("markerWidth", lineWidth * .4)
        .attr("markerHeight", lineWidth * .4);

    let boxStart = d3RightTextNodesArrayZoomedBoxInfo[startIndex];
    let boxEnd = d3RightTextNodesArrayZoomedBoxInfo[endIndex];

    //draw multiple horizontal lines but no more than one vertical line for box to box connections
    let startIndices = [], endIndices = [];
    for (let startsI = boxStart.startI; startsI <= boxStart.stopI; ++startsI) {
        for (let endsI = boxEnd.startI; endsI <= boxEnd.stopI; ++endsI) {
            if (matrix[startsI + "_" + endsI] !== undefined) { //if(matrix[startsI][endsI].z > 0){
                startIndices.push(startsI);
                endIndices.push(endsI);
            }
        }
    }

    for (let i = 0; i < startIndices.length; ++i) {
        let startI = startIndices[i];
        let endI = endIndices[i];

        if (startIndex < endIndex) { //right down arrow
            let x1 = (startI + 1) * n2Dx; //x1
            let x2 = (endI + .5) * n2Dx; //right x2
            let x3 = x2; //down x3

            let y1 = (startI + .5) * n2Dy; //y1
            let y2 = y1; //right y2
            let y3 = endI * n2Dy; //down y3

            DrawPathTwoLines(x1, y1, x2, y2, x3, y3, ptn2.GREEN_ARROW_COLOR, lineWidth, true);
        }
        else if (startIndex > endIndex) { //left up arrow
            //alert("yes");
            let x1 = startI * n2Dx; //x1
            let x2 = (endI + .5) * n2Dx; //left x2
            let x3 = x2; //up x3

            let y1 = (startI + .5) * n2Dy; //y1
            let y2 = y1; //left y2
            let y3 = (endI + 1) * n2Dy; //y1

            DrawPathTwoLines(x1, y1, x2, y2, x3, y3, ptn2.RED_ARROW_COLOR, lineWidth, true);
        }
    }
}

function DrawMatrix() {
    let u0 = n2Dx0 * .5,
        v0 = n2Dy0 * .5,
        u = n2Dx * .5,
        v = n2Dy * .5; //(0,0) = center of cell... (u,v) = bottom right of cell... (-u,-v) = top left of cell

    function GetOnDiagonalCellColor(d) {
        let rt = d3RightTextNodesArrayZoomed[d.c];
        if (rt.isMinimized) return ptn2.COLLAPSED_COLOR;
        if (rt.type === "param") return ptn2.PARAM_COLOR;
        if (rt.type === "unconnected_param") return ptn2.UNCONNECTED_PARAM_COLOR
        return (rt.implicit) ? ptn2.UNKNOWN_IMPLICIT_COLOR : ptn2.UNKNOWN_EXPLICIT_COLOR;
    }

    let classes = ["cell_scalar", "cell_vector", "cell_group", "cell_scalarScalar", "cell_scalarVector", "cell_vectorScalar",
        "cell_vectorVector", "cell_scalarGroup", "cell_groupScalar", "cell_vectorGroup", "cell_groupVector", "cell_groupGroup"
    ];
    let datas = [symbols_scalar, symbols_vector, symbols_group, symbols_scalarScalar, symbols_scalarVector, symbols_vectorScalar,
        symbols_vectorVector, symbols_scalarGroup, symbols_groupScalar, symbols_vectorGroup, symbols_groupVector, symbols_groupGroup
    ];
    let drawFunctions = [DrawScalar, DrawVector, DrawGroup, DrawScalar, DrawVector, DrawVector,
        DrawVector, DrawGroup, DrawGroup, DrawGroup, DrawGroup, DrawGroup
    ];
    for (let i = 0; i < classes.length; ++i) {
        let sel = n2ElementsGroup.selectAll("." + classes[i])
            .data(datas[i], function (d) {
                return d.id;
            });
        let gEnter = sel.enter().append("g")
            .attr("class", classes[i])
            .attr("transform", function (d) {
                if (lastClickWasLeft) return "translate(" + (n2Dx0 * (d.c - enterIndex) + u0) + "," + (n2Dy0 * (d.r - enterIndex) + v0) + ")";
                let roc = (d.obj && FindRootOfChangeFunction) ? FindRootOfChangeFunction(d.obj) : null;
                if (roc) {
                    let index0 = roc.rootIndex0 - zoomedElement.rootIndex0;
                    return "translate(" + (n2Dx0 * index0 + u0) + "," + (n2Dy0 * index0 + v0) + ")";
                }
                alert("error: enter transform not found");
            });
        drawFunctions[i](gEnter, u0, v0, (i < 3) ? GetOnDiagonalCellColor : ptn2.CONNECTION_COLOR, false)
            .on("mouseover", (i < 3) ? mouseOverOnDiagN2 : mouseOverOffDiagN2)
            .on("mouseleave", mouseOutN2)
            .on("click", mouseClickN2);


        let gUpdate = gEnter.merge(sel).transition(sharedTransition)
            .attr("transform", function (d) {
                return "translate(" + (n2Dx * (d.c) + u) + "," + (n2Dy * (d.r) + v) + ")";
            });
        drawFunctions[i](gUpdate, u, v, (i < 3) ? GetOnDiagonalCellColor : ptn2.CONNECTION_COLOR, true);


        let nodeExit = sel.exit().transition(sharedTransition)
            .attr("transform", function (d) {
                if (lastClickWasLeft) return "translate(" + (n2Dx * (d.c - exitIndex) + u) + "," + (n2Dy * (d.r - exitIndex) + v) + ")";
                let roc = (d.obj && FindRootOfChangeFunction) ? FindRootOfChangeFunction(d.obj) : null;
                if (roc) {
                    let index = roc.rootIndex - zoomedElement.rootIndex;
                    return "translate(" + (n2Dx * index + u) + "," + (n2Dy * index + v) + ")";
                }
                alert("error: exit transform not found");
            })
            .remove();
        drawFunctions[i](nodeExit, u, v, (i < 3) ? GetOnDiagonalCellColor : ptn2.CONNECTION_COLOR, true);
    }

    {
        let sel = n2GridLinesGroup.selectAll(".horiz_line")
            .data(gridLines, function (d) {
                return d.obj.id;
            });

        let gEnter = sel.enter().append("g")
            .attr("class", "horiz_line")
            .attr("transform", function (d) {
                if (lastClickWasLeft) return "translate(0," + (n2Dy0 * (d.i - enterIndex)) + ")";
                let roc = (FindRootOfChangeFunction) ? FindRootOfChangeFunction(d.obj) : null;
                if (roc) {
                    let index0 = roc.rootIndex0 - zoomedElement.rootIndex0;
                    return "translate(0," + (n2Dy0 * index0) + ")";
                }
                alert("error: enter transform not found");
            });
        gEnter.append("line")
            .attr("x2", ptn2.WIDTH_N2_PX);

        let gUpdate = gEnter.merge(sel).transition(sharedTransition)
            .attr("transform", function (d) {
                return "translate(0," + (n2Dy * d.i) + ")";
            });
        gUpdate.select("line")
            .attr("x2", ptn2.WIDTH_N2_PX);

        let nodeExit = sel.exit().transition(sharedTransition)
            .attr("transform", function (d) {
                if (lastClickWasLeft) return "translate(0," + (n2Dy * (d.i - exitIndex)) + ")";
                let roc = (FindRootOfChangeFunction) ? FindRootOfChangeFunction(d.obj) : null;
                if (roc) {
                    let index = roc.rootIndex - zoomedElement.rootIndex;
                    return "translate(0," + (n2Dy * index) + ")";
                }
                alert("error: exit transform not found");
            })
            .remove();
    }

    {
        let sel = n2GridLinesGroup.selectAll(".vert_line")
            .data(gridLines, function (d) {
                return d.obj.id;
            });
        let gEnter = sel.enter().append("g")
            .attr("class", "vert_line")
            .attr("transform", function (d) {
                if (lastClickWasLeft) return "translate(" + (n2Dx0 * (d.i - enterIndex)) + ")rotate(-90)";
                let roc = (FindRootOfChangeFunction) ? FindRootOfChangeFunction(d.obj) : null;
                if (roc) {
                    let i0 = roc.rootIndex0 - zoomedElement.rootIndex0;
                    return "translate(" + (n2Dx0 * i0) + ")rotate(-90)";
                }
                alert("error: enter transform not found");
            });
        gEnter.append("line")
            .attr("x1", -ptn2.HEIGHT_PX);

        let gUpdate = gEnter.merge(sel).transition(sharedTransition)
            .attr("transform", function (d) {
                return "translate(" + (n2Dx * d.i) + ")rotate(-90)";
            });
        gUpdate.select("line")
            .attr("x1", -ptn2.HEIGHT_PX);

        let nodeExit = sel.exit().transition(sharedTransition)
            .attr("transform", function (d) {
                if (lastClickWasLeft) return "translate(" + (n2Dx * (d.i - exitIndex)) + ")rotate(-90)";
                let roc = (FindRootOfChangeFunction) ? FindRootOfChangeFunction(d.obj) : null;
                if (roc) {
                    let i = roc.rootIndex - zoomedElement.rootIndex;
                    return "translate(" + (n2Dx * i) + ")rotate(-90)";
                }
                alert("error: exit transform not found");
            })
            .remove();
    }

    {
        let sel = n2ComponentBoxesGroup.selectAll(".component_box")
            .data(drawableN2ComponentBoxes, function (d) {
                return d.obj.id;
            });
        let gEnter = sel.enter().append("g")
            .attr("class", "component_box")
            .attr("transform", function (d) {
                if (lastClickWasLeft) return "translate(" + (n2Dx0 * (d.startI - enterIndex)) + "," + (n2Dy0 * (d.startI - enterIndex)) + ")";
                let roc = (d.obj && FindRootOfChangeFunction) ? FindRootOfChangeFunction(d.obj) : null;
                if (roc) {
                    let index0 = roc.rootIndex0 - zoomedElement.rootIndex0;
                    return "translate(" + (n2Dx0 * index0) + "," + (n2Dy0 * index0) + ")";
                }
                alert("error: enter transform not found");
            });

        gEnter.append("rect")
            .attr("width", function (d) {
                if (lastClickWasLeft) return n2Dx0 * (1 + d.stopI - d.startI);
                return n2Dx0;
            })
            .attr("height", function (d) {
                if (lastClickWasLeft) return n2Dy0 * (1 + d.stopI - d.startI);
                return n2Dy0;
            });

        let gUpdate = gEnter.merge(sel).transition(sharedTransition)
            .attr("transform", function (d) {
                return "translate(" + (n2Dx * d.startI) + "," + (n2Dy * d.startI) + ")";
            });

        gUpdate.select("rect")
            .attr("width", function (d) {
                return n2Dx * (1 + d.stopI - d.startI);
            })
            .attr("height", function (d) {
                return n2Dy * (1 + d.stopI - d.startI);
            });


        let nodeExit = sel.exit().transition(sharedTransition)
            .attr("transform", function (d) {
                if (lastClickWasLeft) return "translate(" + (n2Dx * (d.startI - exitIndex)) + "," + (n2Dy * (d.startI - exitIndex)) + ")";
                let roc = (d.obj && FindRootOfChangeFunction) ? FindRootOfChangeFunction(d.obj) : null;
                if (roc) {
                    let index = roc.rootIndex - zoomedElement.rootIndex;
                    return "translate(" + (n2Dx * index) + "," + (n2Dy * index) + ")";
                }
                alert("error: exit transform not found");
            })
            .remove();

        nodeExit.select("rect")
            .attr("width", function (d) {
                if (lastClickWasLeft) return n2Dx * (1 + d.stopI - d.startI);
                return n2Dx;
            })
            .attr("height", function (d) {
                if (lastClickWasLeft) return n2Dy * (1 + d.stopI - d.startI);
                return n2Dy;
            });
    }
}