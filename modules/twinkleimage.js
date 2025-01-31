/*
 ****************************************
 *** twinkleimage.js: Image CSD module
 ****************************************
 * Mode of invocation:     Tab ("DI")
 * Active on:              File pages with a corresponding file which is local (not on Commons)
 * Config directives in:   TwinkleConfig
 */

Twinkle.image = function twinkleimage() {
	if (mw.config.get('wgNamespaceNumber') === 6 &&
	    !document.getElementById("mw-sharedupload") &&
	    document.getElementById("mw-imagepage-section-filehistory"))
	{
		if(twinkleUserAuthorized) {
			$(twAddPortletLink("#", "DI", "tw-di", "Nominate file for delayed speedy deletion", "")).click(Twinkle.image.callback);
		} else {
			$(twAddPortletLink("#", "DI", "tw-di", "Nominate file for delayed speedy deletion", "")).click(function(){
				alert("Your account is too new to use Twinkle.");
			});
		}
	}
};

Twinkle.image.callback = function twinkleimageCallback() {
	var Window = new SimpleWindow( 600, 300 );
	Window.setTitle( "File for dated speedy deletion" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Speedy deletion policy", "WP:CSD" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#image" );

	var form = new QuickForm( Twinkle.image.callback.evaluate );
	form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Notify original uploader',
					value: 'notify',
					name: 'notify',
					tooltip: "Uncheck this if you are planning to make multiple nominations from the same user, and don't want to overload their talk page with too many notifications.",
					checked: Twinkle.getPref('notifyUserOnDeli')
				}
			]
		}
	);
	var field = form.append( {
			type: 'field',
			label: 'Type of action wanted'
		} );
	field.append( {
			type: 'radio',
			name: 'type',
			event: Twinkle.image.callback.choice,
			list: [
				{
					label: 'No source (CSD F4)',
					value: 'no source',
					checked: true,
					tooltip: 'Image or media has no source information'
				},
				{
					label: 'No license (CSD F4)',
					value: 'no license',
					tooltip: 'Image or media does not have information on its copyright status'
				},
				{
					label: 'No source and no license (CSD F4)',
					value: 'no source no license',
					tooltip: 'Image or media has neither information on source nor its copyright status'
				},
				{
					label: 'Orphaned fair use (CSD F5)',
					value: 'orphaned fair use',
					tooltip: 'Image or media is unlicensed for use on Wikipedia and allowed only under a claim of fair use per Wikipedia:Non-free content, but it is not used in any articles'
				},
				{
					label: 'No fair use rationale (CSD F6)',
					value: 'no fair use rationale',
					tooltip: 'Image or media is claimed to be used under Wikipedia\'s fair use policy but has no explanation as to why it is permitted under the policy'
				},
				{
					label: 'Disputed fair use rationale (CSD F7)',
					value: 'disputed fair use rationale',
					tooltip: 'Image or media has a fair use rationale that is disputed'
				},
				{
					label: 'Replaceable fair use (CSD F7)',
					value: 'replaceable fair use',
					tooltip: 'Image or media may fail Wikipedia\'s first non-free content criterion ([[WP:NFCC#1]]) in that it illustrates a subject for which a free image might reasonably be found or created that adequately provides the same information'
				},
				{
					label: 'No permission (CSD F11)',
					value: 'no permission',
					tooltip: 'Image or media does not have proof that the author agreed to licence the file'
				}
			]
		} );
	form.append( {
			type: 'div',
			label: 'Work area',
			name: 'work_area'
		} );
	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the parameters
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.type[0].dispatchEvent( evt );
};

Twinkle.image.callback.choice = function twinkleimageCallbackChoose(event) {
	var value = event.target.values;
	var root = event.target.form;
	var work_area = new QuickForm.element( {
			type: 'div',
			name: 'work_area'
		} );

	switch( value ) {
		case 'no source no license':
		case 'no source':
			work_area.append( {
					type: 'checkbox',
					name: 'non_free',
					list: [
						{
							label: 'Non-free',
							tooltip: 'Image is licensed under a fair use claim'
						}
					]
				} );
			break;
		case 'no permission':
			work_area.append( {
					type: 'input',
					name: 'source',
					label: 'Source: '
				} );
			break;
		case 'disputed fair use rationale':
			work_area.append( {
					type: 'textarea',
					name: 'reason',
					label: 'Concern: '
				} );
			break;
		case 'orphaned fair use':
			work_area.append( {
					type: 'input',
					name: 'replacement',
					label: 'Replacement: '
				} );
			break;
		case 'replaceable fair use':
			work_area.append( {
					type: 'checkbox',
					name: 'old_image',
					list: [
						{
							label: 'Old image',
							tooltip: 'Image was uploaded before 2006-07-13'
						}
					]
				} );
			break;
		default:
			break;
	}

	root.replaceChild( work_area.render(), $(root).find('div[name="work_area"]')[0] );
};

Twinkle.image.callback.evaluate = function twinkleimageCallbackEvaluate(event) {
	var type, non_free, source, reason, replacement, old_image;
	mw.config.set('wgPageName', mw.config.get('wgPageName').replace(/_/g, ' '));  // for queen/king/whatever and country!

	var notify = event.target.notify.checked;
	var types = event.target.type;
	for( var i = 0; i < types.length; ++i ) {
		if( types[i].checked ) {
			type = types[i].value;
			break;
		}
	}
	if( event.target.non_free ) {
		non_free = event.target.non_free.checked;
	}
	if( event.target.source ) {
		source = event.target.source.value;
	}
	if( event.target.reason ) {
		reason = event.target.reason.value;
	}
	if( event.target.replacement ) {
		replacement = event.target.replacement.value;
	}
	if( event.target.old_image ) {
		old_image = event.target.old_image.checked;
	}

	var csdcrit;
	switch( type ) {
		case 'no source no license':
		case 'no source':
		case 'no license':
			csdcrit = "F4";
			break;
		case 'orphaned fair use':
			csdcrit = "F5";
			break;
		case 'no fair use rationale':
			csdcrit = "F6";
			break;
		case 'disputed fair use rationale':
		case 'replaceable fair use':
			csdcrit = "F7";
			break;
		case 'no permission':
			csdcrit = "F11";
			break;
		default:
			throw new Error( "Twinkle.image.callback.evaluate: unknown criterion" );
	}

	var lognomination = Twinkle.getPref('logSpeedyNominations') && Twinkle.getPref('noLogOnSpeedyNomination').indexOf(csdcrit) === -1;

	var params = {
		'type': type,
		'normalized': csdcrit,
		'non_free': non_free,
		'source': source,
		'reason': reason,
		'replacement': replacement,
		'old_image': old_image,
		'lognomination': lognomination
	};
	SimpleWindow.setButtonsEnabled( false );
	Status.init( event.target );

	Wikipedia.actionCompleted.redirect = mw.config.get('wgPageName');
	Wikipedia.actionCompleted.notice = "Tagging complete";

	// Tagging image
	var wikipedia_page = new Wikipedia.page( mw.config.get('wgPageName'), 'Tagging file with deletion tag' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.load( Twinkle.image.callbacks.taggingImage );

	// Notifying uploader
	if( notify ) {
		wikipedia_page.lookupCreator(Twinkle.image.callbacks.userNotification);
	} else {
		// add to CSD log if desired
		if (lognomination) {
			params.fromDI = true;
			Twinkle.speedy.callbacks.user.addToLog(params, null);
		}
		// No auto-notification, display what was going to be added.
		var noteData = document.createElement( 'pre' );
		noteData.appendChild( document.createTextNode( "{{subst:di-" + type + "-notice|1=" + mw.config.get('wgTitle') + "}} ~~~~" ) );
		Status.info( 'Notification', [ 'Following/similar data should be posted to the original uploader:', document.createElement( 'br' ),  noteData ] );
	}
};

Twinkle.image.callbacks = {
	taggingImage: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		var tag = "{{di-" + params.type + "|date={{subst:#time:j F Y}}";
		switch( params.type ) {
			case 'no source no license':
			case 'no source':
				tag += params.non_free ? "|non-free=yes" : "";
				break;
			case 'no permission':
				tag += params.source ? "|source=" + params.source : "";
				break;
			case 'disputed fair use rationale':
				tag += params.reason ? "|concern=" + params.reason : "";
				break;
			case 'orphaned fair use':
				tag += params.replacement ? "|replacement=" + params.replacement : "";
				break;
			case 'replaceable fair use':
				tag += params.old_image ? "|old image=yes" : "";
				break;
			default:
				break;  // doesn't matter
		}
		tag += "}}\n";

		pageobj.setPageText(tag + text);
		pageobj.setEditSummary("This file is up for deletion, per [[WP:CSD#" + params.normalized + "|CSD " + params.normalized + "]] (" + params.type + ")." + Twinkle.getPref('summaryAd'));
		switch (Twinkle.getPref('deliWatchPage')) {
			case 'yes':
				pageobj.setWatchlist(true);
				break;
			case 'no':
				pageobj.setWatchlistFromPreferences(false);
				break;
			default:
				pageobj.setWatchlistFromPreferences(true);
				break;
		}
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},
	userNotification: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();
		var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
		var notifytext = "\n{{subst:di-" + params.type + "-notice|1=" + mw.config.get('wgTitle');
		if (params.type === 'no permission') {
			notifytext += params.source ? "|source=" + params.source : "";
		}
		notifytext += "}} ~~~~";
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary("Notification: tagging for deletion of [[" + mw.config.get('wgPageName') + "]]." + Twinkle.getPref('summaryAd'));
		usertalkpage.setCreateOption('recreate');
		switch (Twinkle.getPref('deliWatchUser')) {
			case 'yes':
				usertalkpage.setWatchlist(true);
				break;
			case 'no':
				usertalkpage.setWatchlistFromPreferences(false);
				break;
			default:
				usertalkpage.setWatchlistFromPreferences(true);
				break;
		}
		usertalkpage.setFollowRedirect(true);
		usertalkpage.append();

		// add this nomination to the user's userspace log, if the user has enabled it
		if (params.lognomination) {
			params.fromDI = true;
			Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
		}
	}
};
