document.addEventListener('DOMContentLoaded', fn, false);

function fn() 
{
	let htmlString = 
		`
		<p>Hello</p>
		<strong>STRONG</strong>
		`

	let outputString = parser.parse(htmlString);
	document.getElementById("htmlOutput").innerHTML = outputString;
	document.getElementById("textOutput").textContent = outputString;
}
