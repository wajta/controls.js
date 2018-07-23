/*!
 * Controls.js
 * http://controlsjs.com/
 *
 * Copyright (c) 2018 Position s.r.o.  All rights reserved.
 *
 * This version of Controls.js is licensed under the terms of GNU General Public License v3.
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * The commercial license can be purchased at Controls.js website.
 */

/**
 *  Group: Layouts
 */
if(typeof ngUserControls === 'undefined') ngUserControls = {};
ngUserControls['layouts'] = {
  Lib: 'ng_controls',
  ControlsGroup: 'Basic',

  OnInit: function() {

    function layout_dim(def) {
      if((typeof def.L==='undefined')&&(typeof def.R==='undefined'))
      {
        def.L=0;
        if(typeof def.W==='undefined') def.R=0;
      }
      if((typeof def.T==='undefined')&&(typeof def.B==='undefined'))
      {
        def.T=0;
        if(typeof def.H==='undefined') def.B=0;
      }
    }

    function layout_methods(def) {
      ng_MergeDef(def,{
        Methods: {
          CtrlBringToFront: ngc_CtrlBringToFront,
          CtrlSendToBack: ngc_CtrlSendToBack,
          CtrlInsertAfter: ngc_CtrlInsertAfter,
          CtrlInsertBefore: ngc_CtrlInsertBefore
        }
      });
    }

    function Create_PageLayout(def, ref, parent) {
      layout_dim(def);
      ng_MergeDef(def, {
        Data: {
          PagesVisible: false
        }
      });
      return ngCreateControlAsType(def, 'ngPages', ref, parent);
    }

    ngRegisterControlType('ngPageLayout', Create_PageLayout);

    function ngvhlay_setSize(vert,p,v) {
      var b={};
      if(vert) {
        if((typeof p.MinHeight !== 'undefined')&&(v<p.MinHeight)) v=p.MinHeight;
        if((typeof p.MaxHeight !== 'undefined')&&(v>p.MaxHeight)) v=p.MaxHeight;
        b.H=v;
        if(typeof p.Bounds.T!=='undefined') b.B=void 0;
        else b.T=void 0;
      } else {
        if((typeof p.MinWidth !== 'undefined')&&(v<p.MinWidth)) v=p.MinWidth;
        if((typeof p.MaxWidth !== 'undefined')&&(v>p.MaxWidth)) v=p.MaxWidth;
        b.W=v;
        if(typeof p.Bounds.L!=='undefined') b.R=void 0;
        else b.L=void 0;
      }
      if(p.SetBounds(b)) {
        var old_updating_size=p._layout_updating_size;
        p._layout_updating_size=true;
        try {
          p.Update(false);
        } finally {
          p._layout_updating_size=old_updating_size;
          if(typeof p._layout_updating_size==='undefined') delete p._layout_updating_size;
        }
      }
    }

    function ngvhlay_findChild(cc, c, reverse, chidx)
    {
      var i;
      if(typeof chidx==='undefined') chidx=c._layout_child;
      if(typeof chidx==='undefined') chidx=0;
      for(i=0;i<cc.length;i++)
      {
        chidx=chidx%cc.length;
        if(cc[chidx]===c) break;
        if(reverse) {
          chidx--;
          if(chidx<0) chidx=cc.length-1;
        }
        else chidx++;
      }
      if(i>=cc.length) {
        delete c._layout_child;
        return -1; // not a child
      }
      c._layout_child=chidx;
      return chidx;
    }

    function ngvhlay_getBound(p) {
      if(typeof p.HAlign!=='undefined') {
        return p.HAlign==='right' ? 'R' : 'L';
      }
      return p.VAlign==='bottom' ? 'B' : 'T';
    }

    function ngvhlay_reflowChildren(cc, c, chidx, p)
    {
      var ctrl=c;
      var bound=ngvhlay_getBound(p);
      var vert=((bound==='T')||(bound==='B'));
      var t=c.Bounds[bound];
      var padname=vert ? 'VPadding' : 'HPadding';
      var padding=0,ppadding=ngVal(p[padname],0);
      padname='Layout'+padname;
      var o,b={};
      function setbounds(i) {
        if((c)&&(c.Visible)&&(!c.IgnoreLayout)) {
          padding=ngVal(c[padname],ppadding);
          o=c.Elm();
          if(o) t+=(vert ? ng_OuterHeight(o) : ng_OuterWidth(o));
          t+=padding;
        }
        c=cc[i];
        if((c)&&(!c.IgnoreLayout)) {
          b[bound]=t;
          c.SetBounds(b);
        }
      }
      if(p.Reverse) {
        var stop=p.AutoSize ? -1 : 0;
        for(var i=chidx-1;i>=stop;i--) setbounds(i);
      } else {
        var len=cc.length;
        if(p.AutoSize) len++;
        for(var i=chidx+1;i<len;i++) setbounds(i);
      }
      var s=t-padding;
      if(p.AutoSize) ngvhlay_setSize(vert, p, s);

      var po=p.Elm();
      if(po) {
        var w=ng_ClientWidth(po);
        var h=ng_ClientHeight(po);
        if(typeof p._layout_width === 'undefined') p._layout_width=w;
        if(typeof p._layout_height === 'undefined') p._layout_height=h;
        if((p._layout_width!==w)||(p._layout_height!==h)) // Scrollbars changed, redraw
        {
          p._layout_width=w;
          p._layout_height=h;
          p.UpdateChildren();
        }
      }
    }


    function ngvhlay_CtrlUpdate(c) {
      var p=c.ParentControl;
      if((p)&&(!c.IgnoreLayout)) {
        var cc=p.ChildControls;
        if((cc)&&(cc.length)) {
          var chidx=ngvhlay_findChild(cc, c, p.Reverse, p._layout_updating ? p._layout_child_idx : c._layout_child);
          if(chidx<0) return true; // not a child

          var bound=ngvhlay_getBound(p);
          var vert=((bound==='T')||(bound==='B'));

          var t;
          if(((!p.Reverse)&&(!chidx))||((p.Reverse)&&(chidx===cc.length-1))) t=0;
          else {
            var prev = ngvhlay_findPrev(cc, p.Reverse ? chidx+1 : chidx-1, p.Reverse);
            if(!prev) t=0;
            else {
              var po=prev.Elm();
              t=po ? prev.Bounds[bound]+(vert ? ng_OuterHeight(po)+ngVal(prev.LayoutVPadding,ngVal(p.VPadding,0)) : ng_OuterWidth(po)+ngVal(prev.LayoutHPadding,ngVal(p.HPadding,0)) ) : 0;
            }
          }
          var b={};
          b[bound]=t;
          switch(bound) {
            case 'T': b.B=void 0; break;
            case 'B': b.T=void 0; break;
            case 'L': b.R=void 0; break;
            case 'R': b.L=void 0; break;
          }
          c.SetBounds(b);
          return true;
        }
      }
      delete c._layout_child;
      return true;
    }

    function ngvhlay_CtrlUpdated(c,o) {
      var p=c.ParentControl;
      if((!p)||(p._layout_updating)||(typeof c._layout_child === 'undefined')) return;

      var cc=p.ChildControls;
      if((!cc)||(!cc.length)) return;

      ngvhlay_reflowChildren(cc, c, c._layout_child, p);
    }

    function ngvhlay_CtrlVisibleChanged(c) {
      if((c.Visible)||(c.IgnoreLayout)) return;
      var p=c.ParentControl;
      if(!p) return;
      var cc=p.ChildControls;
      if((!cc)||(!cc.length)) return;

      var chidx=ngvhlay_findChild(cc, c, p.Reverse);
      if(chidx<0) return;
      ngvhlay_reflowChildren(cc, c, chidx, p);
    }

    function ngvhlay_AddChildControl(ctrl) {
      ctrl.AddEvent(ngvhlay_CtrlUpdate,'OnUpdate');
      ctrl.AddEvent('OnUpdated',ngvhlay_CtrlUpdated);
      ctrl.AddEvent('OnVisibleChanged',ngvhlay_CtrlVisibleChanged);
    }

    function ngvhlay_RemoveChildControl(ctrl) {
      ctrl.RemoveEvent('OnUpdate',ngvhlay_CtrlUpdate);
      ctrl.RemoveEvent('OnUpdated',ngvhlay_CtrlUpdated);
      ctrl.RemoveEvent('OnVisibleChanged',ngvhlay_CtrlVisibleChanged);
    }

    function ngvhlay_UpdateChildren(recursively)
    {
      var cc=this.ChildControls;
      if((!cc)||(!cc.length)) return;
      if(typeof recursive==='undefined') recursive=true;
      var c;

      var old_layout_updating=this._layout_updating;
      var old_layout_child_idx=this._layout_child_idx;
      this._layout_updating=true;
      try {
        if(this.Reverse) {
          this._layout_child_idx=cc.length-1;
          for(var i=cc.length-1;i>=0;i--)
          {
            this._layout_child_idx=i;
            c=cc[i];
            if(c.Update) c.Update(recursive);
          }
        }
        else {
          this._layout_child_idx=0;
          for(var i=0;i<cc.length;i++)
          {
            this._layout_child_idx=i;
            c=cc[i];
            if(c.Update) c.Update(recursive);
          }
        }
      }
      finally {
        this._layout_updating=old_layout_updating;
        if(typeof this._layout_updating==='undefined') delete this._layout_updating;
        this._layout_child_idx=old_layout_child_idx;
        if(typeof this._layout_child_idx==='undefined') delete this._layout_child_idx;
      }
    }

    function ngvhlay_DoUpdate(o)
    {
      if(!this._layout_updating_size) {
        this._layout_width=ng_ClientWidth(o);
        this._layout_height=ng_ClientHeight(o);
      }
      return ng_CallParent(this,'DoUpdate',arguments,true);
    }

    function ngvhlay_findPrev(cc, i, reverse) {
      var prev=cc[i];
      if((!prev.Visible)||(prev.IgnoreLayout)) {
        if(reverse) {
          for(++i;i<cc.length;i++) {
            prev=cc[i];
            if((prev.Visible)&&(!prev.IgnoreLayout)) break;
          }
          if(i>=cc.length) prev=null;
        }
        else {
          for(--i;i>=0;i--) {
            prev=cc[i];
            if((prev.Visible)&&(!prev.IgnoreLayout)) break;
          }
          if(i<0) prev=null;
        }
      }
      return prev;
    }

    function ngvhlay_calcSize(vert,cc,bound,reverse) {
      var prev = ngvhlay_findPrev(cc, reverse ? 0 : cc.length-1, reverse);
      if(!prev) return 0;
      var po=prev.Elm();
      return po ? prev.Bounds[bound]+(vert ? ng_OuterHeight(po) : ng_OuterWidth(po)) : 0;
    }

    function ngvhlay_Updated()
    {
      if(this._layout_updating_size)  return;

      var bound=ngvhlay_getBound(this);
      var vert=((bound==='T')||(bound==='B'));

      var s;
      var cc=this.ChildControls;
      if(this.AutoSize) {
        if((cc)&&(cc.length>0)) s=ngvhlay_calcSize(vert,cc,bound,this.Reverse);
        else s=0;
      }

      if(typeof s==='undefined') s=(vert ? this.Bounds.H : this.Bounds.W);

      if(typeof s!=='undefined') ngvhlay_setSize(vert, this, s);

      if((cc)&&(cc.length>0)) {
        var o=this.Elm();
        var w=ng_ClientWidth(o);
        var h=ng_ClientHeight(o);
        if((this._layout_width!==w)||(this._layout_height!==h))
        {
          this._layout_width=w;
          this._layout_height=h;
          // Scrollbars changed, redraw
          this.UpdateChildren();
        }
      }
    }

    function Create_VLayout(def, ref, parent) {
      layout_dim(def);
      layout_methods(def);
      ng_MergeDef(def, {
        ScrollBars: ssAuto,
        Data: {
          AutoSize: false,
          VPadding: 0,
          VAlign: 'top',
          Reverse: false,
          MinHeight: void 0,
          MaxHeight: void 0
        },
        Methods: {
          DoUpdate: ngvhlay_DoUpdate,
          UpdateChildren: ngvhlay_UpdateChildren
        },
        Events: {
          OnUpdated: ngvhlay_Updated,
          OnAddChildControl: ngvhlay_AddChildControl,
          OnRemoveChildControl: ngvhlay_RemoveChildControl
        }
      });
      return ngCreateControlAsType(def, 'ngPanel', ref, parent);
    }

    ngRegisterControlType('ngVLayout', Create_VLayout);

    function Create_HLayout(def, ref, parent) {
      layout_dim(def);
      layout_methods(def);
      ng_MergeDef(def, {
        ScrollBars: ssAuto,
        Data: {
          AutoSize: false,
          HPadding: 0,
          HAlign: 'left',
          Reverse: false,
          MinWidth: void 0,
          MaxWidth: void 0
        },
        Methods: {
          DoUpdate: ngvhlay_DoUpdate,
          UpdateChildren: ngvhlay_UpdateChildren
        },
        Events: {
          OnUpdated: ngvhlay_Updated,
          OnAddChildControl: ngvhlay_AddChildControl,
          OnRemoveChildControl: ngvhlay_RemoveChildControl
        }
      });
      return ngCreateControlAsType(def, 'ngPanel', ref, parent);
    }
    ngRegisterControlType('ngHLayout', Create_HLayout);

    function ngclay_CtrlUpdate(c) {
      var p=this.IgnoreLayout ? null : this.ParentControl;
      if(p) {
        var bounds={};
        if(p.HCenter) {
          bounds.L='50%';
          bounds.R=void 0;
        }
        if(p.VCenter) {
          bounds.T='50%';
          bounds.B=void 0;
        }
        this.SetBounds(bounds);
      }
      return true;
    }

    function ngclay_CtrlUpdated(c,o) {
      var p=this.IgnoreLayout ? null : this.ParentControl;
      if(!p) return;
      if(p.HCenter) {
        o.style.marginLeft=-Math.round(ng_OuterWidth(o)/2-ngVal(this.CenterOffsetX,0)-ngVal(p.CenterOffsetX,0))+'px';
      }
      if(p.VCenter) {
        o.style.marginTop=-Math.round(ng_OuterHeight(o)/2-ngVal(this.CenterOffsetY,0)-ngVal(p.CenterOffsetY,0))+'px';
      }
    }

    function ngclay_AddChildControl(ctrl) {
      ctrl.AddEvent(ngclay_CtrlUpdate,'OnUpdate');
      ctrl.AddEvent('OnUpdated',ngclay_CtrlUpdated);
    }

    function ngclay_RemoveChildControl(ctrl) {
      ctrl.RemoveEvent('OnUpdate',ngclay_CtrlUpdate);
      ctrl.RemoveEvent('OnUpdated',ngclay_CtrlUpdated);
    }

    function Create_CenterLayout(def, ref, parent) {
      layout_dim(def,true,false);
      layout_methods(def);
      ng_MergeDef(def, {
        ScrollBars: ssNone,
        Data: {
          CenterOffsetX: 0,
          CenterOffsetY: 0,
          VCenter: true,
          HCenter: true
        },
        Events: {
          OnAddChildControl: ngclay_AddChildControl,
          OnRemoveChildControl: ngclay_RemoveChildControl
        }
      });

      return ngCreateControlAsType(def, 'ngPanel', ref, parent);
    }
    ngRegisterControlType('ngCenteredLayout', Create_CenterLayout);

    function ngconst_Cache(p) {
      var self=this;
      var po=p.Elm();
      var CW={},CH={};

      this.getBound = function(v,bound) {
        var vert=((bound==='T')||(bound==='B'));
        if(typeof v==='number') return v;
        var i,c,sb=''+v;
        for(i=sb.length-1;i>=0;i--) {
          c=sb.charAt(i);
          if(((c>='0')&&(c<='9'))||(c==='.')) break;
        }
        if(sb.substr(i+1)!=='%') return;
        v=parseFloat(sb.substr(0,i+1));
        return Math.floor((vert ? self.getParentHeight() : self.getParentWidth())*(v/100.0));
      }

      this.getParentWidth = function () {
        if(typeof self.parentWidth==='undefined') self.parentWidth=ng_ClientWidth(po);
        return self.parentWidth;
      }
      this.getParentHeight = function () {
        if(typeof self.parentHeight==='undefined') self.parentHeight=ng_ClientHeight(po);
        return self.parentHeight;
      }
      this.invalidate = function() {
        delete self.parentWidth;
        delete self.parentHeight;
        CW={};CH={};
      }
      this.invalidateCtrl = function(c) {
        var id=ngVal(c.ID,'');
        if(id!=='') {
          delete CW[id];
          delete CH[id];
        }
      }
      this.getCtrlWidth = function(c) {
        var v;
        var id=ngVal(c.ID,'');
        if(id!=='') {
          v=CW[id];
          if(typeof v!=='undefined') return v;
        }
        v=ng_OuterWidth(c.Elm());
        if(id!=='') CW[c.ID]=v;
        return v;
      }

      this.getCtrlHeight = function(c) {
        var v;
        var id=ngVal(c.ID,'');
        if(id!=='') {
          v=CH[id];
          if(typeof v!=='undefined') return v;
        }
        v=ng_OuterHeight(c.Elm());
        if(id!=='') CH[c.ID]=v;
        return v;
      }
    }

    function ngconst_calcBound(dep,b,bound,boundrel,margin,cache) {
      if(typeof dep==='undefined') return;
      if(ng_IsArrayVar(dep)) {
        for(var i=0;i<dep.length;i++) ngconst_calcBound(dep[i],b,bound,boundrel,margin,cache);
        return;
      }
      if((typeof dep!=='object')||(!dep)||(!dep.Visible)) return;
      var v=cache.getBound(dep.Bounds[boundrel],boundrel);
      if(typeof v==='undefined') {
        switch(boundrel) {
          case 'L':
            v=cache.getBound(dep.Bounds['R'],'R');
            if(typeof v!=='undefined') {
              v+=cache.getCtrlWidth(dep);
              boundrel='R';
            }
            break;
          case 'R':
            v=cache.getBound(dep.Bounds['L'],'L');
            if(typeof v!=='undefined') {
              v+=cache.getCtrlWidth(dep);
              boundrel='L';
            }
            break;
          case 'T':
            v=cache.getBound(dep.Bounds['B'],'B');
            if(typeof v!=='undefined') {
              v+=cache.getCtrlHeight(dep);
              boundrel='B';
            }
            break;
          case 'B':
            v=cache.getBound(dep.Bounds['T'],'T');
            if(typeof v!=='undefined') {
              v+=cache.getCtrlHeight(dep);
              boundrel='T';
            }
            break;
        }
        if(typeof v==='undefined') return;
      }
      if(bound!==boundrel) {
        switch(bound) {
          case 'L':
          case 'R':
            v=cache.getParentWidth()-v; break;
          case 'T':
          case 'B':
            v=cache.getParentHeight()-v; break;
        }
      }
      v+=cache.getBound(ngVal(margin,0),bound);
      if((typeof b[bound]==='undefined')||(b[bound]<v)) b[bound]=v;
    }

    function ngconst_CtrlUpdate(c) {
      var p=c.ParentControl;
      if(!p) return true;

      var lc=c.LayoutConstraints;
      if((typeof lc!=='object')||(!lc)) return true;

      var cache=p._layout_cache;
      if(typeof cache==='undefined') cache=p._layout_cache=new ngconst_Cache(p);
      else if(!p._layout_updating) cache.invalidate();
      cache.invalidateCtrl(c);

      var b={};
      ngconst_calcBound(lc.LtoL,b,'L','L',lc.LtoLMargin,cache);
      ngconst_calcBound(lc.LtoR,b,'L','R',lc.LtoRMargin,cache);
      ngconst_calcBound(lc.RtoL,b,'R','L',lc.RtoLMargin,cache);
      ngconst_calcBound(lc.RtoR,b,'R','R',lc.RtoRMargin,cache);
      ngconst_calcBound(lc.TtoT,b,'T','T',lc.TtoTMargin,cache);
      ngconst_calcBound(lc.TtoB,b,'T','B',lc.TtoBMargin,cache);
      ngconst_calcBound(lc.BtoT,b,'B','T',lc.BtoTMargin,cache);
      ngconst_calcBound(lc.BtoB,b,'B','B',lc.BtoBMargin,cache);

      function limit(bound,val,align,max) {
        if(typeof val==='undefined') return;
        if((typeof val==='string')&&(p.Guidelines)) {
          var v=p.Guidelines[val];
          if(typeof v==='undefined') {
            v=cache.getBound(val,align);
            if(typeof v==='undefined')
            {
              ngDEBUGERROR('ngConstraintLayout('+p.ID+'): Unknown guideline "'+val+'"!', c);
              return;
            }
          }
          val=v;
        }
        val=cache.getBound(val,align);
        if(align!==bound) {
          switch(align) {
            case 'L':
            case 'R':
              val=cache.getParentWidth()-val;
              max=!max;
              break;
            case 'T':
            case 'B':
              val=cache.getParentHeight()-val;
              max=!max;
              break;
          }
        }
        if((typeof b[bound]==='undefined')||((!max)&&(b[bound]<val))||((max)&&(b[bound]>val))) b[bound]=val;
      }

      limit('L',lc.LMin,'L');
      limit('L',lc.LMax,'L',true);
      limit('L',lc.LMinR,'R');
      limit('L',lc.LMaxR,'R',true);
      limit('R',lc.RMin,'R');
      limit('R',lc.RMax,'R',true);
      limit('R',lc.RMinL,'L');
      limit('R',lc.RMaxL,'L',true);
      limit('T',lc.TMin,'T');
      limit('T',lc.TMaxB,'B',true);
      limit('T',lc.TMinB,'B');
      limit('T',lc.TMax,'T',true);
      limit('B',lc.BMin,'B');
      limit('B',lc.BMax,'B',true);
      limit('B',lc.BMinT,'T');
      limit('B',lc.BMaxT,'T',true);

      for(var i in b) { // check if not empty
        if((typeof b.L!=='undefined')&&(typeof b.R!=='undefined')&&(typeof c.Bounds.W!=='undefined')) b.W=void 0;
        if((typeof b.T!=='undefined')&&(typeof b.B!=='undefined')&&(typeof c.Bounds.H!=='undefined')) b.H=void 0;
        c.SetBounds(b);
        break;
      }
      return true;
    }

    function ngconst_dependsOn(ctrl,c) {
      var ld=ctrl._layout_depends;
      if(typeof ld === 'undefined') return false;
      var dc;
      ctrl._layout_checking_dependson=true;
      try {
        for(var i=ld.length-1;i>=0;i--) {
          dc=ld[i];
          if(dc===c) return true;
          if(dc._layout_checking_dependson) continue;
          if(ngconst_dependsOn(dc,c)) return true;
        }
        return false;
      } finally {
        delete ctrl._layout_checking_dependson;
      }
    }

    function ngconst_CtrlUpdateDependent(c)
    {
      var p=c.ParentControl;
      if(!p) return;

      if((typeof c._layout_dependent !== 'undefined')&&(c._layout_dependent.length)&&(typeof p._layout_controls !== 'undefined')) {
        var old_layout_updating=p._layout_updating;
        p._layout_updating=true;
        try {
          var ctrl,lctrls=p._layout_controls;
          var update=false;
          for(var i=0;i<lctrls.length;i++) {
            ctrl=lctrls[i];
            if(ctrl===c) update=true;
            else if(ngconst_dependsOn(ctrl,c)) ctrl.Update();
          }
        }
        finally {
          p._layout_updating=old_layout_updating;
          if(typeof p._layout_updating==='undefined') delete p._layout_updating;
        }
      }

      var po=p.Elm();
      if(po) {
        var w=ng_ClientWidth(po);
        var h=ng_ClientHeight(po);
        if(typeof p._layout_width === 'undefined') p._layout_width=w;
        if(typeof p._layout_height === 'undefined') p._layout_height=h;
        if((p._layout_width!==w)||(p._layout_height!==h)) // Scrollbars changed, redraw
        {
          p._layout_width=w;
          p._layout_height=h;
          p.UpdateChildren();
        }
      }
    }

    function ngconst_CtrlUpdated(c,o) {
      var p=c.ParentControl;
      if((!p)||(p._layout_updating)) return;

      ngconst_CtrlUpdateDependent(c);

      var cache=p._layout_cache;
      if(typeof cache!=='undefined') cache.invalidate();
    }

    function ngconst_CtrlVisibleChanged(c) {
      if((c.Visible)||(typeof c._layout_dependent === 'undefined')) return;

      var p=c.ParentControl;
      if(!p) return;

      var cache=p._layout_cache;
      if(typeof cache!=='undefined') cache.invalidate();
      try {
        ngconst_CtrlUpdateDependent(c)
      } finally {
        cache=p._layout_cache;
        if(typeof cache!=='undefined') cache.invalidate();
      }
    }

    function ngconst_arrAddOnce(a,it) {
      for(var i=a.length-1;i>=0;i--) if(a[i]===it) return;
      a.push(it);
    }

    function ngconst_arrRemove(a,it) {
      for(var i=a.length-1;i>=0;i--) if(a[i]===it) { a.splice(i,1); return }
    }

    function ngconst_removeConst(p,c) {
      function remove(n) {
        var r=p[n];
        if(typeof r!=='undefined') {
          ngconst_arrRemove(r,c);
          if(!r.length) delete p[n];
        }
      }
      remove('_layout_independent');
      remove('_layout_needresolve');
      remove('_layout_controls');
      var ctrl;
      var r=c._layout_dependent;
      if(typeof r!=='undefined') {
        for(var i=r.length-1;i>=0;i--) {
          ctrl=r[i];
          if(typeof ctrl!=='object') continue;
          if(typeof ctrl._layout_depends!=='undefined') {
            ngconst_arrRemove(ctrl._layout_depends,c);
            if(!ctrl._layout_depends.length) delete ctrl._layout_depends;
          }
        }
      }
      delete c._layout_dependent;

      r=c._layout_depends;
      if(typeof r!=='undefined') {
        for(var i=r.length-1;i>=0;i--) {
          ctrl=r[i];
          if(typeof ctrl!=='object') continue;
          if(typeof ctrl._layout_dependent!=='undefined') {
            ngconst_arrRemove(ctrl._layout_dependent,c);
            if(!ctrl._layout_dependent.length) delete ctrl._layout_dependent;
          }
        }
      }
      delete c._layout_depends;
    }

    function ngconst_ResolveAll(lc,p) {
      if((!lc)||(typeof lc!=='object')) return false;
      var cc=p.ChildControls;
      if((!cc)||(!cc.length)) return false;

      function find(id) {
        for(var i=cc.length-1;i>=0;i--) if(cc[i].LayoutID===id) return cc[i];
        return null;
      }

      function resolve(lc,it)
      {
        var cc=lc[it];
        if(typeof cc==='undefined') return;
        var ctrl;

        if(ng_IsArrayVar(cc)) {
          for(var i=0;i<cc.length;i++) if(typeof cc[i]==='string') {
            ctrl=find(cc[i]);
            if(ctrl) { cc[i]=ctrl; ret=true; }
          }
          return;
        }
        if(typeof cc==='string') {
          ctrl=find(cc);
          if(ctrl) { lc[it]=ctrl; ret=true; }
        }
        return true;
      }

      resolve(lc,'LtoL');
      resolve(lc,'LtoR');
      resolve(lc,'RtoL');
      resolve(lc,'RtoR');
      resolve(lc,'TtoT');
      resolve(lc,'TtoB');
      resolve(lc,'BtoT');
      resolve(lc,'BtoB');
      return ret;
    }

    function ngconst_Resolve(c,id,ctrl) {
      var lc=c.LayoutConstraints;
      if((!lc)||(typeof lc!=='object')) return false;
      var ret=false;

      function resolve(lc,it)
      {
        var cc=lc[it];
        if(typeof cc==='undefined') return;

        if(ng_IsArrayVar(cc)) {
          for(var i=0;i<cc.length;i++) if(cc[i]===id) { cc[i]=ctrl; ret=true; }
          return;
        }
        if((typeof cc==='string')&&(cc===id)) { lc[it]=ctrl; ret=true; }
      }
      resolve(lc,'LtoL');
      resolve(lc,'LtoR');
      resolve(lc,'RtoL');
      resolve(lc,'RtoR');
      resolve(lc,'TtoT');
      resolve(lc,'TtoB');
      resolve(lc,'BtoT');
      resolve(lc,'BtoB');
      return ret;
    }

    function ngconst_calcDepth(c) {
      var ld=c._layout_depends;
      if((typeof ld==='undefined')||(!ld.length)) return 0;
      var ctrl,d=0;
      for(var i=ld.length-1;i>=0;i--)
      {
        ctrl=ld[i];
        if((typeof ctrl==='object')&&(typeof ctrl._layout_depth!=='undefined')&&(ctrl._layout_depth>d)) d=ctrl._layout_depth;
      }
      return d+1;
    }

    function ngconst_updateDepth(p,updepth,pc,remove) {
      if((typeof updepth!=='undefined')&&(updepth.length>0)) {
        var uc,depth,first;
        if(typeof remove === 'undefined') {
          remove=[]; first=true;
        }
        try {
          for(var i=updepth.length-1;i>=0;i--) {
            uc=updepth[i];
            if(typeof uc==='string') continue;
            if(uc._layout_updating_depth) continue;
            depth=ngconst_calcDepth(uc);
            if(depth!==uc._layout_depth) { // depth changed
              uc._layout_depth=depth;
              ngconst_addControl(p,uc,true);
              uc._layout_updating_depth=true;
              remove.push(uc);
              ngconst_updateDepth(p,uc._layout_dependent,uc,remove);
            }
          }
        } finally {
          if(first) {
            for(var i=remove.length-1;i>=0;i--) delete remove[i]._layout_updating_depth;
          }
        }
      }
    }

    function ngconst_addControl(p,c,resort) {
      if(typeof p._layout_controls === 'undefined') {
        p._layout_controls=[];
        p._layout_controls.push(c);
        return;
      }
      var depth=c._layout_depth;
      var lctrl,depcnt=typeof c._layout_dependent === 'undefined' ? 0 : c._layout_dependent.length;
      var inserted=false;
      for(var i=p._layout_controls.length-1;i>=0;i--) {
        lctrl=p._layout_controls[i];
        if(lctrl===c) { p._layout_controls.splice(i,1); continue; }
        if(inserted) continue;
        if((lctrl._layout_depth>depth)||((lctrl._layout_depth===depth)&&((typeof lctrl._layout_dependent === 'undefined' ? 0 : lctrl._layout_dependent.length)>depcnt))) continue;
        p._layout_controls.splice(i+1,0,c);
        inserted=true;
        if(!resort) break;
      }
      if(!inserted) p._layout_controls.splice(0,0,c);
    }

    function ngconst_addConst(p,c) {
      var lc=c.LayoutConstraints;
      var don=[];
      var updepth;

      var r=p._layout_needresolve;
      if(typeof r!=='undefined') {
        function resolve(ctrl) {
          var d=ctrl._layout_depends;
          var ct;
          var allresolved=true;
          for(var i=d.length-1;i>=0;i--) {
            ct=d[i];
            if(typeof ct==='string') {
              if(ct===c.LayoutID) {
                d[i]=c;
                if(ngconst_Resolve(ctrl,c.LayoutID,c)) {
                  if(typeof c._layout_dependent==='undefined') c._layout_dependent=[];
                  ngconst_arrAddOnce(c._layout_dependent,ctrl);
                  if(typeof updepth==='undefined') updepth=[];
                  ngconst_arrAddOnce(updepth,ctrl);
                }
              }
              else allresolved=false;
            }
          }
          return allresolved;
        }

        for(var i=r.length-1;i>=0;i--) if(resolve(r[i])) r.splice(i,1);
        if(!r.length) delete p._layout_needresolve;
      }

      if((lc)&&(typeof lc==='object')) {

        function adddep(ctrl) {
          if(ng_IsArrayVar(ctrl)) {
            for(var i=0;i<ctrl.length;i++) adddep(ctrl[i]);
            return;
          }
          if(typeof ctrl==='string') {
            var cc=p.ChildControls;
            if((cc)&&(cc.length)) {
              for(var i=cc.length-1;i>=0;i--) if(cc[i].LayoutID===ctrl) {
                ctrl=cc[i];
                ngconst_Resolve(c,ctrl.LayoutID,ctrl);
                break;
              }
            }
          }
          if(!ctrl) return;
          var i;
          if(typeof ctrl==='object') {
            if(typeof ctrl._layout_dependent==='undefined') ctrl._layout_dependent=[];
            ngconst_arrAddOnce(ctrl._layout_dependent,c);
          } else {
            if(typeof p._layout_needresolve === 'undefined') p._layout_needresolve=[];
            ngconst_arrAddOnce(p._layout_needresolve,c);
          }
          ngconst_arrAddOnce(don,ctrl);
        }

        adddep(lc.LtoL);
        adddep(lc.LtoR);
        adddep(lc.RtoL);
        adddep(lc.RtoR);
        adddep(lc.TtoT);
        adddep(lc.TtoB);
        adddep(lc.BtoT);
        adddep(lc.BtoB);
      }

      if(!don.length) {
        if(typeof p._layout_independent==='undefined') p._layout_independent=[];
        p._layout_independent.push(c);
        delete c._layout_depends;
        delete c._layout_depth;
      } else {
        c._layout_depends=don;
        c._layout_depth=ngconst_calcDepth(c);
        ngconst_addControl(p,c);
      }
      ngconst_updateDepth(p,updepth);
    }

    function ngconst_UpdateConstraints() {
      // clear constraints
      delete this._layout_needresolve;
      delete this._layout_independent;
      delete this._layout_controls;

      var cc=this.ChildControls;
      if((!cc)||(!cc.length)) return;
      var i,c;
      for(i=cc.length-1;i>=0;i--) {
        c=cc[i];
        if(!c) continue;
        delete c._layout_dependent;
        delete c._layout_depends;
        delete c._layout_depth;
      }
      // rebuild constraints
      for(i=0;i<cc.length;i++) {
        ngconst_addConst(this,cc[i]);
      }

      if(ngHASDEBUG()) ngconst_debugCheck(this);
    }

    function ngconst_UpdateChildren(recursively)
    {
      var cc=this.ChildControls;
      if((!cc)||(!cc.length)) return;
      if(typeof recursive==='undefined') recursive=true;
      var c;

      var old_layout_updating=this._layout_updating;
      this._layout_updating=true;

      var cache=this._layout_cache;
      if(typeof cache!=='undefined') cache.invalidate();
      try {
        cc=this._layout_independent;
        if(typeof cc!=='undefined') {
          for(var i=0;i<cc.length;i++) {
            c=cc[i];
            if(c.Update) c.Update(recursive);
          }
        }

        cc=this._layout_controls;
        if(typeof cc!=='undefined') {
          for(var i=0;i<cc.length;i++) {
            c=cc[i];
            if(c.Update) c.Update(recursive);
          }
        }
      }
      finally {
        cache=this._layout_cache;
        if(typeof cache!=='undefined') cache.invalidate();
        this._layout_updating=old_layout_updating;
        if(typeof this._layout_updating==='undefined') delete this._layout_updating;
      }
    }

    function ngconst_CtrlUpdateBounds(props) {
      if(this.SetBounds(props)) {
        this.Update(recursive);
        return true;
      }
      return false;
    }

    function ngconst_CtrlSetLayoutConstraints(cons) {
      var p=this.ParentControl;
      var lc=this.LayoutConstraints;
      if(typeof lc!=='undefined') {
        ngconst_ResolveAll(cons,p);
        ngconst_ResolveAll(lc,p);
      }
      var exists=(typeof lc!=='undefined');
      if(!exists) lc={};
      var changed=false;
      for(var i in cons)
      {
        switch(i)
        {
          case 'LtoL':
          case 'LtoR':
          case 'RtoL':
          case 'RtoR':
          case 'TtoT':
          case 'TtoB':
          case 'BtoT':
          case 'BtoB':
            if((lc[i]!=cons[i])||(typeof lc[i]!==typeof cons[i])) { lc[i]=cons[i]; changed=true; }
            break;
        }
      }
      if(!changed) return false;

      this.LayoutConstraints=lc;
      if(!exists) {
        ngconst_addConst(p,this);
        if(ngHASDEBUG()) ngconst_debugCheck(p);
      }
      else {
        if(ng_EmptyVar(lc)) ngconst_removeConst(p,this);
        else p.UpdateConstraints();
      }
      return true;
    }

    function ngconst_AddChildControl(ctrl) {
      ngconst_addConst(this,ctrl);
      ng_OverrideMethod(ctrl,'UpdateBounds',ngconst_CtrlUpdateBounds);
      ng_OverrideMethod(ctrl,'SetLayoutConstraints',ngconst_CtrlSetLayoutConstraints);
      ctrl.AddEvent(ngconst_CtrlUpdate,'OnUpdate');
      ctrl.AddEvent('OnUpdated',ngconst_CtrlUpdated);
      ctrl.AddEvent('OnVisibleChanged',ngconst_CtrlVisibleChanged);
    }

    function ngconst_RemoveChildControl(ctrl) {
      ngconst_removeConst(this,ctrl);
      if(ng_IsOverriden(ctrl.UpdateBounds)) ctrl.UpdateBounds.removeOverride(ngconst_CtrlUpdateBounds);
      if(ng_IsOverriden(ctrl.SetLayoutConstraints)) ctrl.SetLayoutConstraints.removeOverride(ngconst_CtrlSetLayoutConstraints);
      ctrl.RemoveEvent('OnUpdate',ngconst_CtrlUpdate);
      ctrl.RemoveEvent('OnUpdated',ngconst_CtrlUpdated);
      ctrl.RemoveEvent('OnVisibleChanged',ngconst_CtrlVisibleChanged);
    }

    function ngconst_debugCheck(c)
    {
      var ur=c._layout_needresolve;
      if(typeof ur !== 'undefined') {
        var uc,d;
        for(var i=0;i<ur.length;i++) {
          uc=ur[i];
          d=uc._layout_depends;
          if(typeof d!=='undefined') {
            for(var j=0;j<d.length;j++) {
              if(typeof d[j]==='string') {
                ngDEBUGERROR('ngConstraintLayout('+c.ID+'): Unresolved constraint "'+d[j]+'"!', uc);
              }
            }
          }
        }
      }

      var ur=c.ChildControls;
      if(typeof ur !== 'undefined') {
        var reported={}, remove=[];
        var circular_dep=false;

        function check_circles(ctrl, from) {
          var ld=ctrl._layout_dependent;
          if(typeof ld === 'undefined') return false;

          if(typeof from==='undefined') from=ctrl;
          var dc,ret=false;
          ctrl._layout_checking_circles=true;
          remove.push(ctrl);
          for(var i=ld.length-1;i>=0;i--) {
            dc=ld[i];
            if(reported[dc.ID]) continue;
            if(dc._layout_checking_circles) {
              ngDEBUGERROR('ngConstraintLayout('+c.ID+'): Circular constraint found!', dc);
              circular_dep=true;
              reported[dc.ID]=true;
              ret=true;
              continue;
            }
            if(check_circles(dc,from)) { reported[dc.ID]=true; ret=true; }
          }
          return ret;
        }
        for(var i=0;i<ur.length;i++) {
          if(!reported[ur[i].ID]) check_circles(ur[i]);
        }
        for(var i=remove.length-1;i>=0;i--) delete remove[i]._layout_checking_circles;

        if((circular_dep)&&(!c.InDesignMode)) {
          // clear layout
          delete c._layout_needresolve;
          delete c._layout_independent;
          delete c._layout_controls;
        }
      }
    }

    function ngconst_DoUpdate(o)
    {
      this._layout_width=ng_ClientWidth(o);
      this._layout_height=ng_ClientHeight(o);
      return ng_CallParent(this,'DoUpdate',arguments,true);
    }

    function ngconst_Updated()
    {
      var cc=this.ChildControls;
      if((cc)&&(cc.length>0)) {
        var o=this.Elm();
        var w=ng_ClientWidth(o);
        var h=ng_ClientHeight(o);
        if((this._layout_width!==w)||(this._layout_height!==h))
        {
          this._layout_width=w;
          this._layout_height=h;
          // Scrollbars changed, redraw
          this.UpdateChildren();
        }
      }
    }

    function Create_ConstraintLayout(def, ref, parent) {
      layout_dim(def,true,false);
      ng_MergeDef(def, {
        ScrollBars: ssAuto,
        Data: {
          Guidelines: {}
        },
        Methods: {
          DoUpdate: ngconst_DoUpdate,
          UpdateConstraints: ngconst_UpdateConstraints,
          UpdateChildren: ngconst_UpdateChildren
        },
        Events: {
          OnUpdated: ngconst_Updated,
          OnAddChildControl: ngconst_AddChildControl,
          OnRemoveChildControl: ngconst_RemoveChildControl
        }
      });
      if(ngHASDEBUG()) {
        def.OnCreated=ngAddEvent(def.OnCreated, function (c, ref) {
          ngconst_debugCheck(c);
        });
      }
      return ngCreateControlAsType(def, 'ngPanel', ref, parent);
    }
    ngRegisterControlType('ngConstraintLayout', Create_ConstraintLayout);

  }
};
