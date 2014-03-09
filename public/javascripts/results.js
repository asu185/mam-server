//alert('test');
$(document).ready(function(){
	//$("node").draggable();
	var nodeData = document.getElementById('nodeData').innerHTML;
	var linkData = document.getElementById('linkData').innerHTML;
	var nodeDataArray = JSON.parse(nodeData);
	var linkDataArray = JSON.parse(linkData);

	var diagram = new go.Diagram("myDiagramDiv");
	diagram.nodeTemplate =
      go.GraphObject.make(go.Node, "Auto",
        go.GraphObject.make(go.Shape, "RoundedRectangle",
          // Shape.fill is bound to Node.data.color
          new go.Binding("fill", "color")),
        go.GraphObject.make(go.TextBlock,
          { margin: 3 },  // some room around the text
          // TextBlock.text is bound to Node.data.key
          new go.Binding("text", "key"))
      );
	diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
	//diagram.model.addNodeData({ key: "Alpha" });
	/*
	function goIntro() {
		
		var nodeDataArray = [
			{ key: "Alpha" },
			{ key: "Beta" }, 
			{ key: "Gama"}
		];
		
		var linkDataArray = [
			{ from: "Alpha", to: "Beta" },
			{ from: "Alpha", to: "Gama"}
		];
		diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
	}
	//goIntro();
	*/
});