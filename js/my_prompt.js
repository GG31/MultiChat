/** My prompt pour avoir le mot de passe encodé */

//Fonction de création du prompt
function myPrompt(){
    //création d'un div qui parent qui prend toute la page et permet juste d'empecher le click ailleur que dans la fenetre prompt
    var panel = document.createElement("div");
    panel.setAttribute("style", "position:absolute;width:100%;height:100%;top:0;left:0;z-index:100;");
    panel.id = "myPrompt";
    //création de la représentation graphique du prompt
    var block = document.createElement("div");
    block.setAttribute("style", "padding-top:18px;margin:auto;margin-top:100px;background-color:#e5e5e5;width:200px;height:100px;text-align:center;border:1px solid #b2b2b2");
    panel.appendChild(block);
    //ajout de text
    block.appendChild(document.createTextNode('Please enter the administration password'));
    //ajout de l'input password
    var pass = document.createElement("input");
    pass.type="password";
    pass.setAttribute("style", "margin:10px");
    pass.id = "password";
    block.appendChild(pass);
    //ajout du bouton de validation
    var valider = document.createElement("input");
    valider.type="button";
    valider.value="Valider";
    valider.setAttribute("onclick", "validerPassword(document.getElementById('password').value);");
    block.appendChild(valider);
    document.body.appendChild(panel);
}
