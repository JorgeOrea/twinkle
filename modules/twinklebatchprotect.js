/*
 ****************************************
 *** twinklebatchprotect.js: Batch protect module (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("P-batch")
 * Active on:              Existing and non-existing non-articles, and Special:PrefixIndex
 * Config directives in:   TwinkleConfig
 */


Twinkle.batchprotect = function twinklebatchprotect() {
	if( userIsInGroup( 'sysop' ) && (wgNamespaceNumber > 0 || wgCanonicalSpecialPageName == 'Prefixindex') ) {
		$(twAddPortletLink("#", "P-batch", "tw-pbatch", "Protect pages found on this page", "")).click(Twinkle.batchprotect.callback);
	}
};

Twinkle.batchprotect.unlinkCache = {};
Twinkle.batchprotect.callback = function twinklebatchprotectCallback() {
	var Window = new SimpleWindow( 800, 400 );
	Window.setTitle( "Batch protection" );

	var form = new QuickForm( Twinkle.batchprotect.callback.evaluate );
	form.append( {
			type: 'select',
			name: 'move',
			label: 'Move protection',
			list: [
				{ 
					label: 'Allow all users (still autoconfirmed)',
					value: '',
					selected: true
				},
				{ 
					label: 'Block new and unregistered users',
					value: 'autoconfirmed'
				},
				{
					label: 'Block all non-admin users',
					value: 'sysop'
				}
			]
		} );
	form.append( {
			type: 'select',
			name: 'edit',
			label: 'Edit protection',
			list: [
				{ 
					label: 'Allow all users',
					value: '',
					selected: true
				},
				{ 
					label: 'Block new and unregistered users',
					value: 'autoconfirmed'
				},
				{
					label: 'Block all non-admin users',
					value: 'sysop'
				}
			]
		} );
	form.append( {
			type: 'select',
			name: 'create',
			label: 'Create protection',
			list: [
				{ 
					label: 'Allow all users (still autoconfirmed)',
					value: '',
					selected: true
				},
				{ 
					label: 'Block new and unregistered users',
					value: 'autoconfirmed'
				},
				{
					label: 'Block all non-admin users',
					value: 'sysop'
				}
			]
		} );
	form.append( {
			type: 'checkbox',
			list: [
				{
					name: 'cascade',
					label: 'Cascade protection'
				}
			]
		} );
	form.append( {
			type: 'select',
			name: 'expiry',
			label: 'Expiration: ',
			list: [
				{ label: '15 minutes', value: '15 minutes' },
				{ label: '30 minutes', value: '30 minutes' },
				{ label: '45 minutes', value: '45 minutes' },
				{ label: '1 hour', value: '1 hour' },
				{ label: '2 hours', value: '2 hours' },
				{ label: '3 hours', value: '3 hours' },
				{ label: '6 hours', value: '6 hours' },
				{ label: '12 hours', value: '12 hours' },
				{ label: '1 day', value: '1 day' },
				{ label: '2 days', value: '2 days' },
				{ label: '3 days', value: '3 days' },
				{ label: '4 days', value: '4 days' },
				{ label: '5 days', value: '5 days' },
				{ label: '6 days', value: '6 days' },
				{ label: '1 week', value: '1 week' },
				{ label: '2 weeks', value: '2 weeks' },
				{ label: '1 month', value: '1 month' },
				{ label: '2 months', value: '2 months' },
				{ label: '3 months', value: '3 months' },
				{ label: '6 months', value: '6 months' },
				{ label: '1 year', value: '1 year' },
				{ label: '2 years', value: '2 years' },
				{ label: '3 years', value: '3 years' },
				{ label: '6 years', value: '6 years' },
				{ label: 'indefinite', selected: true, value:'indefinite' }
			]
		} );
	
	form.append( {
			type: 'textarea',
			name: 'reason',
			label: 'Reason: '
		} );

	var query;

	if( wgNamespaceNumber == Namespace.CATEGORY ) {

		query = {
			'action': 'query',
			'generator': 'categorymembers',
			'gcmtitle': wgPageName,
			'gcmlimit' : Twinkle.getPref('batchMax'), // the max for sysops
			'prop': [ 'revisions' ],
			'rvprop': [ 'size' ]
		};
	} else if( wgCanonicalSpecialPageName == 'Prefixindex' ) {
		query = {
			'action': 'query',
			'generator': 'allpages',
			'gapnamespace': QueryString.exists('namespace') ? QueryString.get( 'namespace' ): document.getElementById('namespace').value,
			'gapprefix': QueryString.exists('from') ? QueryString.get( 'from' ).replace('+', ' ').toUpperCaseFirstChar() : document.getElementById('nsfrom').value.toUpperCaseFirstChar(),
			'gaplimit' : Twinkle.getPref('batchMax'), // the max for sysops
			'prop' : [ 'revisions' ],
			'rvprop': [ 'size' ]
		};
	} else {
		query = {
			'action': 'query',
			'gpllimit' : Twinkle.getPref('batchMax'), // the max for sysops
			'generator': 'links',
			'titles': wgPageName,
			'prop': [ 'revisions' ],
			'rvprop': [ 'size' ]
		};

	}
	var wikipedia_api = new Wikipedia.api( 'Grabbing pages', query, function( self ) {
			var xmlDoc = self.responseXML;
			var snapshot = xmlDoc.evaluate('//page', xmlDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null );
			var list = [];
			for ( var i = 0; i < snapshot.snapshotLength; ++i ) {
				var object = snapshot.snapshotItem(i);
				var page = xmlDoc.evaluate( '@title', object, null, XPathResult.STRING_TYPE, null ).stringValue;
				var size = xmlDoc.evaluate( 'revisions/rev/@size', object, null, XPathResult.NUMBER_TYPE, null ).numberValue;

				list.push( {label:page + (size ? ' (' + size + ')' : '' ), value:page, checked: true });
			}
			self.params.form.append( {
					type: 'checkbox',
					name: 'pages',
					list: list
				}
			);
			self.params.form.append( { type:'submit' } );

			var result = self.params.form.render();
			self.params.Window.setContent( result );


		}  );

	wikipedia_api.params = { form:form, Window:Window };
	wikipedia_api.post();
	var root = document.createElement( 'div' );
	Status.init( root );
	Window.setContent( root );
	Window.display();
};

Twinkle.batchprotect.currentProtectCounter = 0;
Twinkle.batchprotect.currentprotector = 0;
Twinkle.batchprotect.callback.evaluate = function twinklebatchprotectCallbackEvaluate(event) {
	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!
	var pages = event.target.getChecked( 'pages' );
	var reason = event.target.reason.value;
	var create = event.target.create.value;
	var edit = event.target.edit.value;
	var cascade = event.target.cascade.checked;
	var expiry = event.target.expiry.value;
	var move = event.target.move.value;
	if( ! reason ) {
		return;
	}
	Status.init( event.target );
	if( !pages ) {
		Status.error( 'Error', 'nothing to delete, aborting' );
		return;
	}

	function toCall( work ) {
		if( work.length === 0 && Twinkle.batchprotect.currentProtectCounter <= 0 ) {
			Status.info( 'work done' );
			window.clearInterval( Twinkle.batchprotect.currentprotector );
			Wikipedia.removeCheckpoint();
			return;
		} else if( work.length !== 0 && Twinkle.batchprotect.currentProtectCounter <= Twinkle.getPref('batchProtectMinCutOff') ) {
			var pages = work.shift();
			Twinkle.batchprotect.currentProtectCounter += pages.length;
			for( var i = 0; i < pages.length; ++i ) {
				var page = pages[i];
				var query = {
					'action': 'query',
					'titles': page
				};
				var wikipedia_api = new Wikipedia.api( 'Checking if page ' + page + ' exists', query, Twinkle.batchprotect.callbacks.main );
				wikipedia_api.params = { page:page, reason:reason, move: move, edit: edit, create: create, expiry: expiry, cascade: cascade };
				wikipedia_api.post();
			}
		}
	}
	var work = pages.chunk( Twinkle.getPref('batchProtectChunks') );
	Wikipedia.addCheckpoint();
	Twinkle.batchprotect.currentprotector = window.setInterval( toCall, 1000, work );
};

Twinkle.batchprotect.callbacks = {
	main: function( self ) {
		var xmlDoc = self.responseXML;
		var normal = xmlDoc.evaluate( '//normalized/n/@to', xmlDoc, null, XPathResult.STRING_TYPE, null ).stringValue;
		if( normal ) {
			self.params.page = normal;
		}

		var query = { 
			'title': self.params.page, 
			'action': 'protect'
		};
		var wikipedia_wiki = new Wikipedia.wiki( 'Protecting page ' + self.params.page, query, Twinkle.batchprotect.callbacks.protectPage, function( self ) { 
				--Twinkle.batchprotect.currentProtectCounter;
				var link = document.createElement( 'a' );
				link.setAttribute( 'href', wgArticlePath.replace( '$1', self.query.title ) );
				link.setAttribute( 'title', self.query.title );
				link.appendChild( document.createTextNode( self.query.title ) );
				self.statelem.info( [ 'completed (' , link , ')' ] );

			} );
		wikipedia_wiki.params = self.params;
		wikipedia_wiki.followRedirect = false;
		wikipedia_wiki.get();		
	},
	protectPage: function( self ) {
		var form  = self.responseXML.getElementById( 'mw-Protect-Form' );
		var postData = {
			'wpEditToken': form.wpEditToken.value,
			'mwProtect-level-edit': self.params.edit,
			'wpProtectExpirySelection-edit': self.params.expiry != 'indefinite' ? 'othertime' : 'indefinite',
			'mwProtect-expiry-edit': self.params.expiry != 'indefinite' ? self.params.expiry : undefined,
			'mwProtect-level-move': self.params.move,
			'wpProtectExpirySelection-move': self.params.expiry != 'indefinite' ? 'othertime' : 'indefinite',
			'mwProtect-expiry-move': self.params.expiry != 'indefinite' ? self.params.expiry : undefined,
			'mwProtect-cascade': self.params.cascade ? '' : undefined,
			'mwProtectWatch': form.mwProtectWatch.checked ? '' : undefined,
			'wpProtectReasonSelection': 'other',
			'mwProtect-reason': self.params.reason + Twinkle.getPref('protectionSummaryAd')
		};

		self.post( postData );
	}
};
