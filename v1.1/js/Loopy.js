/**********************************

LOOPY!
- with edit & play mode

**********************************/

Loopy.MODE_EDIT = 0;
Loopy.MODE_PLAY = 1;

Loopy.TOOL_INK = 0;
Loopy.TOOL_DRAG = 1;
Loopy.TOOL_ERASE = 2;
Loopy.TOOL_LABEL = 3;

function Loopy(config){

	var self = this;
	self.config = config;

	// Loopy: EMBED???
	self.embedded = _getParameterByName("embed");
	self.embedded = !!parseInt(self.embedded); // force to Boolean

	// Offset & Scale?!?!
	self.offsetX = 0;
	self.offsetY = 0;
	self.offsetScale = 1;

	// Mouse
	Mouse.init(document.getElementById("canvasses")); // TODO: ugly fix, ew
	
	// Model
	self.model = new Model(self);

	// Loopy: SPEED!
	self.signalSpeed = 3;

	// Sidebar
	self.sidebar = new Sidebar(self);
	self.sidebar.showPage("Edit"); // start here

	// Play/Edit mode
	self.mode = Loopy.MODE_EDIT;

	// Tools
	self.toolbar = new Toolbar(self);
	self.tool = Loopy.TOOL_INK;
	self.ink = new Ink(self);
	self.drag = new Dragger(self);
	self.erase = new Eraser(self);
	self.label = new Labeller(self);

	// Play Controls
	self.playbar = new PlayControls(self);
	self.playbar.showPage("Editor"); // start here

	// Modal
	self.modal = new Modal(self);

	//////////
	// INIT //
	//////////

	self.init = function(){
		self.loadFromURL(); // try it.
		
		// Notify parent window that Loopy is ready
		try {
			window.parent.postMessage({ type: 'loopy_ready' }, '*');
		} catch (e) {
			console.log('Error sending ready message:', e);
		}
		
		// Add a listener for messages from the parent window
		window.addEventListener('message', function(event) {
			// Check for model data from parent
			if (event.data && event.data.action === 'load' && event.data.data) {
				try {
					var modelData = JSON.parse(event.data.data);
					self.loadExternalModel(modelData);
				} catch (e) {
					console.error('Error loading external model:', e);
				}
			}
			
			// Handle export to CatColab request
			if (event.data && event.data.action === 'requestExportCatColab') {
				console.log('Loopy received request to export to CatColab');
				try {
					// Convert current model to CatColab format
					console.log('Converting current model to CatColab format...');
					var catColabModel = convertToColabFormat();
					console.log('Model converted successfully:', catColabModel);
					
					// Send it back to the parent window
					window.parent.postMessage({
						action: 'exportCatColab',
						data: JSON.stringify(catColabModel)
					}, '*');
					console.log('Sent CatColab data back to parent');
				} catch (e) {
					console.error('Error exporting to CatColab:', e);
					console.error('Error details:', e.message);
					console.error('Stack trace:', e.stack);
				}
			}
		});
	};

	// Helper function to convert Loopy model to CatColab format
	function convertToColabFormat() {
		// Generate a UUID with the exact format used in CatColab
		// The format appears to be '01' + a 6-digit hex in first group, followed by standard 4-4-4-12 groups
		function generateUUID() {
			// Helper to generate hex string of exact length
			function getHexString(length) {
				let result = '';
				const characters = '0123456789abcdef';
				for (let i = 0; i < length; i++) {
					result += characters.charAt(Math.floor(Math.random() * characters.length));
				}
				return result;
			}
			
			// Exactly match the format from the example files
			return '01' + getHexString(6) + '-' + 
				getHexString(4) + '-' + 
				getHexString(4) + '-' + 
				getHexString(4) + '-' + 
				getHexString(12);
		}
		
		// Initialize CatColab model with exact structure from examples
		var catColabModel = {
			name: "",
			notebook: {
				cells: []
			},
			theory: "causal-loop",
			type: "model"
		};
		
		// Create a map to store node IDs for reference in morphisms
		var nodeIDMap = {};
		var cellArray = catColabModel.notebook.cells;
		
		// Process nodes to objects (first pass)
		self.model.nodes.forEach(function(node) {
			// Generate UUIDs for cell and object
			var cellId = generateUUID();
			var objectId = generateUUID();
			
			// Store the mapping for later use in morphisms
			nodeIDMap[node.id] = objectId;
			
			// Create object cell structure
			var objectCell = {
				tag: "formal",
				id: cellId,
				content: {
					tag: "object",
					id: objectId,
					name: node.label || ("Node " + node.id),
					obType: {
						tag: "Basic",
						content: "Object"
					}
				}
			};
			
			// Add to cells array
			cellArray.push(objectCell);
		});
		
		// Process edges to morphisms (second pass)
		self.model.edges.forEach(function(edge) {
			// Generate UUIDs for cell and morphism
			var cellId = generateUUID();
			var morphismId = generateUUID();
			
			// Determine morType based on edge strength
			var morphismType = edge.strength > 0 ? 
				{
					tag: "Hom",
					content: {
						tag: "Basic",
						content: "Object"
					}
				} :
				{
					tag: "Basic",
					content: "Negative"
				};
			
			// Create morphism cell structure
			var morphismCell = {
				tag: "formal",
				id: cellId,
				content: {
					tag: "morphism",
					id: morphismId,
					name: "",
					morType: morphismType,
					dom: {
						tag: "Basic",
						content: nodeIDMap[edge.from.id]
					},
					cod: {
						tag: "Basic",
						content: nodeIDMap[edge.to.id]
					}
				}
			};
			
			// Add to cells array
			cellArray.push(morphismCell);
		});
		
		// Add a stem cell (typically found in examples)
		cellArray.push({
			tag: "stem",
			id: generateUUID()
		});
		
		return catColabModel;
	}

	// Load model from external data format
	self.loadExternalModel = function(modelData) {
		try {
			// Reset everything
			publish("model/reset");
			self.model.clear();
			self.model.edges = [];
			
			// Convert our model format to Loopy's serialized format
			const loopyFormat = convertToLoopyFormat(modelData);
			
			// Use Loopy's own deserialization which properly handles object creation
			self.model.deserialize(loopyFormat);
			
			// Switch to play mode
			self.setMode(Loopy.MODE_PLAY);
			
		} catch (error) {
			console.error("Critical error in loadExternalModel:", error);
		}
	};

	// Helper function to convert our model format to Loopy's serialized format
	function convertToLoopyFormat(model) {
		try {
			// Create arrays for nodes, edges, and labels
			const nodes = [];
			const edges = [];
			const labels = [];
			
			// Process nodes
			if (model.nodes && Array.isArray(model.nodes)) {
				for (let i = 0; i < model.nodes.length; i++) {
					const node = model.nodes[i];
					// Format: [id, x, y, init, label, hue]
					nodes.push([
						i+1, // Loopy uses 1-based IDs
						node.x,
						node.y,
						1, // init value
						encodeURIComponent(node.name || ""),
						node.hue || 0
					]);
				}
			}
			
			// Process edges
			if (model.edges && Array.isArray(model.edges)) {
				for (let i = 0; i < model.edges.length; i++) {
					const edge = model.edges[i];
					// Format: [from_id, to_id, arc, strength, rotation]
					edges.push([
						edge.from + 1, // convert to 1-based IDs
						edge.to + 1,   // convert to 1-based IDs
						edge.arc || 0,
						edge.strength || 1,
						0 // rotation
					]);
				}
			}
			
			// Process labels
			if (model.labels && Array.isArray(model.labels)) {
				for (let i = 0; i < model.labels.length; i++) {
					const label = model.labels[i];
					// Format: [x, y, text]
					labels.push([
						label.x,
						label.y,
						encodeURIComponent(label.text || "")
					]);
				}
			}
			
			// Return serialized format: [nodes, edges, labels, mode]
			return JSON.stringify([nodes, edges, labels, Loopy.MODE_PLAY]);
		} catch (error) {
			console.error("Error converting to Loopy format:", error);
			return "[]";
		}
	}

	///////////////////
	// UPDATE & DRAW //
	///////////////////

	// Update
	self.update = function(){
		Mouse.update();
		if(self.wobbleControls>=0) self.wobbleControls--; // wobble
		if(!self.modal.isShowing){ // modAl
			self.model.update(); // modEl
		}
	};
	setInterval(self.update, 1000/30); // 30 FPS, why not.

	// Draw
	self.draw = function(){
		if(!self.modal.isShowing){ // modAl
			self.model.draw(); // modEl
		}
		requestAnimationFrame(self.draw);
	};

	// TODO: Smarter drawing of Ink, Edges, and Nodes
	// (only Nodes need redrawing often. And only in PLAY mode.)

	//////////////////////
	// PLAY & EDIT MODE //
	//////////////////////

	self.showPlayTutorial = false;
	self.wobbleControls = -1;
	self.setMode = function(mode){

		self.mode = mode;
		publish("loopy/mode");

		// Play mode!
		if(mode==Loopy.MODE_PLAY){
			self.showPlayTutorial = true; // show once!
			if(!self.embedded) self.wobbleControls=45; // only if NOT embedded
			self.sidebar.showPage("Edit");
			self.playbar.showPage("Player");
			self.sidebar.dom.setAttribute("mode","play");
			self.toolbar.dom.setAttribute("mode","play");
			document.getElementById("canvasses").removeAttribute("cursor"); // TODO: EVENT BASED
		}else{
			publish("model/reset");
		}

		// Edit mode!
		if(mode==Loopy.MODE_EDIT){
			self.showPlayTutorial = false; // donezo
			self.wobbleControls = -1; // donezo
			self.sidebar.showPage("Edit");
			self.playbar.showPage("Editor");
			self.sidebar.dom.setAttribute("mode","edit");
			self.toolbar.dom.setAttribute("mode","edit");
			document.getElementById("canvasses").setAttribute("cursor", self.toolbar.currentTool); // TODO: EVENT BASED
		}

	};

	/////////////////
	// SAVE & LOAD //
	/////////////////

	self.dirty = false;

	// YOU'RE A DIRTY BOY
	subscribe("model/changed", function(){
		if(!self.embedded) self.dirty = true;
	});

	subscribe("export/file", function(){
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + self.model.serialize());
		element.setAttribute('download', "system_model.loopy");

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	});

	subscribe("import/file", function(){
		let input = document.createElement('input');
		input.type = 'file';
		input.onchange = e => {
			var file = e.target.files[0];
			var reader = new FileReader();
			reader.readAsText(file,'UTF-8');
			reader.onload = readerEvent => {
				var content = readerEvent.target.result;
				self.model.deserialize(content);
			}
		};
		input.click();
	});

	// Convert and export model to CatColab format
	subscribe("export/catcolab", function(){
		// Convert the model to CatColab format
		var catColabModel = convertToColabFormat();

		// Create downloadable file
		var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(catColabModel, null, 2));
		var downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute("href", dataStr);
		downloadAnchorNode.setAttribute("download", "loopy_export_catcolab.json");
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	});

	self.saveToURL = function(embed){

		// Create link
		var dataString = self.model.serialize();
		var uri = dataString; // encodeURIComponent(dataString);
		var base = window.location.origin + window.location.pathname;
		var historyLink = base+"?data="+uri;
		var link;
		if(embed){
			link = base+"?embed=1&data="+uri;
		}else{
			link = historyLink;
		}

		// NO LONGER DIRTY!
		self.dirty = false;

		// PUSH TO HISTORY
		window.history.replaceState(null, null, historyLink);

		return link;
	};
	
	// "BLANK START" DATA:
	var _blankData = "[[[1,403,223,1,%22something%22,4],[2,405,382,1,%22something%2520else%22,5]],[[2,1,94,-1,0],[1,2,89,1,0]],[[609,311,%22need%2520ideas%2520on%2520what%2520to%250Asimulate%253F%2520how%2520about%253A%250A%250A%25E3%2583%25BBtechnology%250A%25E3%2583%25BBenvironment%250A%25E3%2583%25BBeconomics%250A%25E3%2583%25BBbusiness%250A%25E3%2583%25BBpolitics%250A%25E3%2583%25BBculture%250A%25E3%2583%25BBpsychology%250A%250Aor%2520better%2520yet%252C%2520a%250A*combination*%2520of%250Athose%2520systems.%250Ahappy%2520modeling!%22]],2%5D";

	self.loadFromURL = function(){
		var data = _getParameterByName("data");
		if(!data) data=decodeURIComponent(_blankData);
		self.model.deserialize(data);
	}; 


	///////////////////////////
	//////// EMBEDDED? ////////
	///////////////////////////

	self.init();

	if(self.embedded){

		// Hide all that UI
		self.toolbar.dom.style.display = "none";
		self.sidebar.dom.style.display = "none";

		// If *NO UI AT ALL*
		var noUI = !!parseInt(_getParameterByName("no_ui")); // force to Boolean
		if(noUI){
			_PADDING_BOTTOM = _PADDING;
			self.playbar.dom.style.display = "none";
		}

		// Fullscreen canvas
		document.getElementById("canvasses").setAttribute("fullscreen","yes");
		self.playbar.dom.setAttribute("fullscreen","yes");
		publish("resize");

		// Center & SCALE The Model
		self.model.center(true);
		subscribe("resize",function(){
			self.model.center(true);
		});

		// Autoplay!
		self.setMode(Loopy.MODE_PLAY);

		// Also, HACK: auto signal
		var signal = _getParameterByName("signal");
		if(signal){
			signal = JSON.parse(signal);
			var node = self.model.getNode(signal[0]);
			node.takeSignal({
				delta: signal[1]*0.33
			});
		}

	}else{

		// Center all the nodes & labels

		// If no nodes & no labels, forget it.
		if(self.model.nodes.length>0 || self.model.labels.length>0){

			// Get bounds of ALL objects...
			var bounds = self.model.getBounds();
			var left = bounds.left;
			var top = bounds.top;
			var right = bounds.right;
			var bottom = bounds.bottom;

			// Re-center!
			var canvasses = document.getElementById("canvasses");
			var cx = (left+right)/2;
			var cy = (top+bottom)/2;
			var offsetX = (canvasses.clientWidth+50)/2 - cx;
			var offsetY = (canvasses.clientHeight-80)/2 - cy;

			// MOVE ALL NODES
			for(var i=0;i<self.model.nodes.length;i++){
				var node = self.model.nodes[i];
				node.x += offsetX;
				node.y += offsetY;
			}

			// MOVE ALL LABELS
			for(var i=0;i<self.model.labels.length;i++){
				var label = self.model.labels[i];
				label.x += offsetX;
				label.y += offsetY;
			}

		}

	}

	// NOT DIRTY, THANKS
	self.dirty = false;

	// SHOW ME, THANKS
	document.body.style.opacity = "";

	// GO.
	requestAnimationFrame(self.draw);


}