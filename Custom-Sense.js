var prefix = window.location.pathname.substr(0, window.location.pathname.toLowerCase().lastIndexOf("/extensions") + 1);
var config = {
	host: window.location.hostname,
	prefix: prefix,
	port: window.location.port,
	isSecure: window.location.protocol === "https:"
};
//to avoid errors in workbench: you can remove this when you have added an app
var app;
require.config({
	baseUrl: (config.isSecure ? "https://" : "http://") + config.host + (config.port ? ":" + config.port : "") + config.prefix + "resources"
});
require(["js/qlik"], function(qlik) {
	var control = false;
	qlik.setOnError(function(error) {
		$('#popupText').append(error.message + "<br>");
		if (!control) {
			control = true;
			$('#popup').delay(1000).fadeIn(1000).delay(11000).fadeOut(1000);
		}
	});
	$("#closePopup").click(function() {
		$('#popup').hide();
		$('#popupText').empty();
	});
	if ($('ul#qbmlist li').length === 0) {
		$('#qbmlist').append("<li><a>No bookmarks available</a></li>");
	}
	$("body").css("overflow: hidden;");

	function AppUi(app) {
		var me = this;
		this.app = app;
		app.global.isPersonalMode(function(reply) {
			me.isPersonalMode = reply.qReturn;
		});
		app.getAppLayout(function(layout) {
			$("#title").html(layout.qTitle);
			$("#title").attr("title", "Last reload:" + layout.qLastReloadTime.replace(/T/, ' ').replace(/Z/, ' '));
			//TODO: bootstrap tooltip ??
		});
		app.getList('SelectionObject', function(reply) {
			$("[data-qcmd='back']").parent().toggleClass('disabled', reply.qSelectionObject.qBackCount < 1);
			$("[data-qcmd='forward']").parent().toggleClass('disabled', reply.qSelectionObject.qForwardCount < 1);
		});
		app.getList("BookmarkList", function(reply) {
			var str = "";
			reply.qBookmarkList.qItems.forEach(function(value) {
				if (value.qData.title) {
					str += '<li><a data-id="' + value.qInfo.qId + '">' + value.qData.title + '</a></li>';
				}
			});
			str += '<li><a data-cmd="create">Create</a></li>';
			$('#qbmlist').html(str).find('a').on('click', function() {
				var id = $(this).data('id');
				if (id) {
					app.bookmark.apply(id);
				} else {
					var cmd = $(this).data('cmd');
					if (cmd === "create") {
						$('#createBmModal').modal();
					}
				}
			});
		});
		$("[data-qcmd]").on('click', function() {
			var $element = $(this);
			switch ($element.data('qcmd')) {
				//app level commands
				case 'clearAll':
					app.clearAll();
					break;
				case 'back':
					app.back();
					break;
				case 'forward':
					app.forward();
					break;
				case 'lockAll':
					app.lockAll();
					break;
				case 'unlockAll':
					app.unlockAll();
					break;
				case 'createBm':
					var title = $("#bmtitle").val(),
						desc = $("#bmdesc").val();
					app.bookmark.create(title, desc);
					$('#createBmModal').modal('hide');
					break;
			}
		});
	}
	var appname, app, sheetname, totalapp = 0;;
	$("#sheetbutton").hide();

	function callbackMess(mess) {
		$('#popupText').append(mess + "<br>");
		$('#popup').delay(1000).fadeIn(1000).delay(11000).fadeOut(1000);
		console.log(mess);
		
	}
	qlik.getAppList(function(list) {
		//var str = "";
		$("#applist").empty();
		list.forEach(function(value) {
			//str +=  value.qDocName + '('+ value.qDocId +') ';
			totalapp++;
			$('<li><a href="#" id="' + value.qDocId + '">' + value.qDocName + '</a></li>').appendTo("#applist");
			if (totalapp === list.length) {
				callbackMess("App List Loaded");
			}
		});
	}, config);
	$("#applist").click(function(e) {
		$("#sheetbutton").show();
		$("#appbutton").empty();
		$("#appbutton").append(e.target.innerText + ' <b class="caret"></b>');
		$("#appbutton").attr('app-id', e.target.id);
		var global = qlik.getGlobal(config);
		global.isPersonalMode(function (reply){
			 if(reply.qReturn){
					//Do something
					appname = $("#appbutton").text().trim();
			 }
			 else{
				   //Do something
				   appname = e.target.id;
			 }
		}).then(function(){
			console.log(appname,":",e.target.id);
			app = qlik.openApp(appname+"", config);
			callbackMess(appname + " is Selected.");
			if (app) {
			new AppUi(app);
			// sheet list
			app.getList("sheet", function(reply) {
				var str = "";
				//console.log(reply);
				$('#sheet_list').empty();
				$.each(reply.qAppObjectList.qItems, function(key, value) {
					var id = value.qInfo.qId;
					var title = value.qMeta.title;
					// option 1
					// $('<li><a href="#" id="'+id+'">' + title + '</a></li>').appendTo("#sheet_list");
					// option 2 <b class="glyphicon glyphicon-chevron-right"></b>
					$('<li><a href="#" id="' + id + '" class="viewsheet">' + title + '  </a></li>').appendTo("#sheet_list");
				});
			});
		}
		});
	});
	// option 2
	$("#sheet_list").click(function(e) {
		var appid = $("#appbutton").attr('app-id');
		var sheetid = e.target.id;
		callbackMess(sheetid + " Sheet is Selected.");
		$('#sheet_view').empty().append("<br><iframe src='"+window.location.origin+"/single/?appid=" + appid + "&sheet=" + sheetid + "&lang=en-US&opt=currsel' style='border:none; width: 100%;height: 90vh;'></iframe>");
		$(this).find(".active").removeClass("active");
		$('#' + e.target.id).parent().addClass("active");
	});
	// end 
});
