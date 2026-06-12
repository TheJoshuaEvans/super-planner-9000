/**
 * About page: General app information.
 */
function About() {
  return (
    <section className="flex flex-1 items-center rounded-lg border border-dashed border-app-border bg-app-surface/70 px-10 py-16 md:px-14">
      <div className="w-full text-left">
        <h2 className="text-2xl font-semibold tracking-tight">About this App</h2>
        <p className="mt-2 text-sm text-app-muted">For several years I have been experimenting with various productivity tools and techniques using white-boards and pen/paper. This app is a culmination of those experiments, designed to help me plan and organize my days more effectively. I've found that it is helpful to break down days into categories, rather than try to micro-manage exact tasks or to just allow the day to unfold without structure. I am also not a big fan of eating food, so it is especially helpful for me to be able to plan my meals lest I forget to eat.</p>

        <h3 className="mt-6 text-lg font-medium tracking-tight">How to Use the App</h3>
        <p className="text-sm text-app-muted">Note: This application is currently designed for use on desktop devices and is mostly untested on mobile for the time being</p> 
        <p className="mt-2 text-sm text-app-muted">To get started, navigate to the dashboard and begin planning your week by adding and organizing timeline blocks from the available categories in the bottom panel. Drag a category onto a timeline to create a new block, and adjust its duration by resizing it. You can also move blocks around to rearrange your schedule, and even move blocks across dates.</p>

        <p className="mt-2 text-sm text-app-muted">To create meals, navigate to the meal creator tab to create potential meal components and combine them into complete meals. These meals can then be assigned to any "Eat" blocks on your timeline by clicking on the block and selecting the desired meal(s). Any assigned meals can also be used to generate a printable shopping list.</p>

        <p className="mt-2 text-sm text-app-muted">The settings tab allows you to customize your experience with the app, including managing the connection with your Google account so that calendar events can be synchronized and application data can be saved to your Google Drive account as hidden app data. Since this site has no backend, you may need to re-authenticate periodically - a button will appear at the top of the page if authentication has expired.</p>

        <h3 className="mt-6 text-lg font-medium tracking-tight">GitHub Repository</h3>
        <p className="mt-2 text-sm text-app-muted">This application source code is available under an MIT license. You can find the source code for this project on <a href="https://github.com/thejoshuaevans/super-planner-9000" className="text-app-accent underline">GitHub</a>.</p>

        <h3 className="mt-6 text-lg font-medium tracking-tight">Notice on AI Use</h3>
        <p className="mt-2 text-sm text-app-muted">Much of this website has been developed with the direct assistance of LLMs. Claude and GitHub Copilot are responsible for a majority of the actual written code in this project. I am primarily a backend developer, and these AI tools have been invaluable in actually implementing the user experience of the application. The overall structure of the application is carefully designed to be as friendly to an LLM workflow as possible.</p>
      </div>
    </section>
  );
}

export default About;
