/*
 ****************************************
 *** twinklediff.js: Diff module
 ****************************************
 * Mode of invocation:     Tab on non-diff pages ("Last"); tabs on diff pages ("Since", "Since mine", "Current")
 * Active on:              Existing non-special pages
 * Config directives in:   TwinkleConfig
 */

Twinkle.diff = function twinklediff() { 
	if( mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId') ) {
		return;
	}

	var query = {
		'title': mw.config.get('wgPageName'),
		'diff': 'cur',
		'oldid': 'prev'
	};

	twAddPortletLink( mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/index.php?' + QueryString.create( query ), 'Last', 'tw-lastdiff', 'Show most recent diff' );

	// Show additional tabs only on diff pages
	if (QueryString.exists('diff')) {
		$(twAddPortletLink("#", 'Since', 'tw-since', 'Show difference between last diff and the revision made by previous user' )).click(function(){Twinkle.diff.evaluate(false);});
		$(twAddPortletLink("#", 'Since mine', 'tw-sincemine', 'Show difference between last diff and my last revision' )).click(function(){Twinkle.diff.evaluate(true);});

		var oldid = /oldid=(.+)/.exec($('div#mw-diff-ntitle1 strong a').first().attr("href"))[1];
		query = {
			'title': mw.config.get('wgPageName'),
			'diff': 'cur',
			'oldid' : oldid
		};
		twAddPortletLink( mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/index.php?' + QueryString.create( query ), 'Current', 'tw-curdiff', 'Show difference to current revision' );
	}
};

Twinkle.diff.evaluate = function twinklediffEvaluate(me) {
	var ntitle = getElementsByClassName( document.getElementById('bodyContent'), 'td' , 'diff-ntitle' )[0];

	var user;
	if( me ) {
		user = mw.config.get('wgUserName');
	} else {
		var node = document.getElementById( 'mw-diff-ntitle2' );
		if( ! node ) {
			// nothing to do?
			return;
		}
		user = $(node).find('a').first().text();
	}
	var query = {
		'prop': 'revisions',
		'action': 'query',
		'titles': mw.config.get('wgPageName'),
		'rvlimit': 1, 
		'rvprop': [ 'ids', 'user' ],
		'rvstartid': mw.config.get('wgCurRevisionId') - 1, // i.e. not the current one
		'rvuser': user
	};
	Status.init( document.getElementById('bodyContent') );
	var wikipedia_api = new Wikipedia.api( 'Grabbing data of initial contributor', query, Twinkle.diff.callbacks.main );
	wikipedia_api.params = { user: user };
	wikipedia_api.post();
};

Twinkle.diff.callbacks = {
	main: function( self ) {
		var xmlDoc = self.responseXML;
		var revid = $(xmlDoc).find('rev').attr('revid');

		if( ! revid ) {
			self.statelem.error( 'no suitable earlier revision found, or ' + self.params.user + ' is the only contributor. Aborting.' );
			return;
		}
		var query = {
			'title': mw.config.get('wgPageName'),
			'oldid': revid,
			'diff': mw.config.get('wgCurRevisionId')
		};
		window.location = mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/index.php?' + QueryString.create( query );
	}
};
