Help from Gemini 2.5 pro was used to implement most of the features within the desired time. The chat was exported and included inside this repository, called gemini.

The project can be initialized by running npm install and then npm run dev.

The hardest part was approaching the categorization. This is a problem that I have faced many times, mostly in Python, but always in the backend, never in the front-end. A heavy npm library containing dictionaries could be used to tackle this problem, but I wanted to implement something myself, so after chatting with Gemini I settled for using some short lists and word matching.

I relied on Gemini to create a boilerplate containing a table with the features that I needed. Some of the errors that I manually fixed were related to imports and the rendering of the transactions. I implemented some CSS changes manually to improve UX. After that, I asked it to help with the customization of categories inside the table and adding labels to the form fields.

I added a table with the total and average spending by category below the main table.

My next objective was to add a bar chart with the spending by category. This was tricky because I usually use react-chartjs-2, but its Svelte equivalent was not available to Svelte 5, so I had to rely on pure chart.js. The chart could be improved, but it works well enough.

After a few problems with re-renders because of the chart, I was able to include it without issues. I wanted to implement some more features, but time was running out. I do not like to rely that much on AI agents, but in this case, the time constraint would have made it harder to do a lot by hand in a short time. I tried not to focus that much on CSS, only the minimum necessary for the UX to work correctly. The categorization uses mostly generic keywords, but for it to work better an expansion of the dictionaries would be necessary. I'm sure tools for this must already exist in JS/TS.

One more thing I wanted to add is a data integrity step to be sure some transactions with incorrect data would not break the table, for example, a non-existent date or a string inside amount, but again, I ran out of time.

The "learning from user corrections" could not be easily implemented with my current categorization approach, so I didn't focus on implementing it.
