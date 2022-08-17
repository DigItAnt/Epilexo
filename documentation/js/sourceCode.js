/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

document.addEventListener('DOMContentLoaded', function() {
    var $tabSource = document.querySelector('#source-tab'),
        $tabInfo = document.querySelector('#info-tab'),
        $tabReadme = document.querySelector('#readme-tab'),
        $tabTemplate = document.querySelector('#templateData-tab'),
        $tabTree = document.querySelector('#tree-tab'),
        $tabExample = document.querySelector('#example-tab'),
        $prismPre = document.querySelector('pre.compodoc-sourcecode');
    if ($tabSource && $prismPre) {
        $prismCode = $prismPre.querySelector('code'),
        $content = document.querySelector('.content'),
        prismLinks = document.querySelectorAll('.link-to-prism')

        for (var i = 0; i < prismLinks.length; i++) {
            prismLinks[i].addEventListener('click', linkToPrism, false);
        }

        function linkToPrism(event) {
            var targetLine = event.target.getAttribute('data-line');
            event.preventDefault();

            $prismPre.setAttribute('data-line', targetLine);
            Prism.highlightElement($prismCode, function() {});

            $tabSource.click();

            setTimeout(function() {
                var $prismHighlightLine = document.querySelector('.line-highlight'),
                    top = parseInt(getComputedStyle($prismHighlightLine)['top']);
                $content.scrollTop = top;
            }, 500);
        };

        window.onhashchange = function(event) {
            switch (window.location.hash) {
                case '':
                case '#info':
                    $tabInfo.click();
                    break;
                case '#readme':
                    $tabReadme.click();
                    break;
                case '#source':
                    $tabSource.click();
                    break;
                case '#template':
                    $tabTemplate.click();
                    break;
                case '#dom-tree':
                    $tabTree.click();
                    break;
                case '#example':
                    $tabExample.click();
                    break;
            }
        }
    }
});
