/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('module-graph-svg')) {
        panZoom = svgPanZoom(document.getElementById('module-graph-svg').querySelector('svg'), {
            zoomEnabled: true,
            minZoom: 1,
            maxZoom: 5
        });
    
        document.getElementById('zoom-in').addEventListener('click', function(ev) {
            ev.preventDefault();
            panZoom.zoomIn();
        });
    
        document.getElementById('zoom-out').addEventListener('click', function(ev) {
            ev.preventDefault();
            panZoom.zoomOut();
        });
    
        document.getElementById('reset').addEventListener('click', function(ev) {
            ev.preventDefault();
            panZoom.resetZoom();
            panZoom.resetPan();
        });
    
        var overviewFullscreen = false,
            originalOverviewHeight;
    
        document.getElementById('fullscreen').addEventListener('click', function(ev) {
            if (overviewFullscreen) {
                document.getElementById('module-graph-svg').style.height = originalOverviewHeight;
                overviewFullscreen = false;
                if (ev.target) {
                    ev.target.classList.remove('ion-md-close');
                    ev.target.classList.add('ion-ios-resize');
                }
            } else {
                originalOverviewHeight = document.getElementById('module-graph-svg').style.height;
                document.getElementById('module-graph-svg').style.height = '85vh';
                overviewFullscreen = true;
                if (ev.target) {
                    ev.target.classList.remove('ion-ios-resize');
                    ev.target.classList.add('ion-md-close');
                }
            }
            document.getElementById('module-graph-svg').querySelector('svg').style.height = document.getElementById('module-graph-svg').clientHeight;
            setTimeout(function() {
                panZoom.resize();
                panZoom.fit();
                panZoom.center();
            }, 0)
        });
    }
});
