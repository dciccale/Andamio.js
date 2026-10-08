(function () {
  'use strict';

  var Task = Andamio.Model.extend({ defaults: { title: '', done: false } });
  var Tasks = Andamio.Collection.extend({ model: Task });
  var tasks = new Tasks([{ title: 'Review the sample app' }, { title: 'Add your first task' }]);

  var TaskView = Andamio.ItemView.extend({
    tagName: 'li',
    template: _.template('<label><input type="checkbox" <%= done ? "checked" : "" %>> <span class="<%= done ? "done" : "" %>"><%- title %></span></label> <button type="button" class="remove" aria-label="Remove task: <%- title %>">Remove</button>'),
    events: { 'change input': 'toggle', 'click .remove': 'removeTask' },
    modelEvents: { 'change:done': 'render' },
    toggle: function () { this.model.set('done', !this.model.get('done')); },
    removeTask: function () { tasks.remove(this.model); }
  });
  var TaskList = Andamio.CollectionView.extend({ tagName: 'ul', className: 'tasks', itemView: TaskView });
  var TasksPage = Andamio.ItemView.extend({
    collection: tasks,
    collectionView: TaskList,
    template: function () {
      return '<h1>Your tasks</h1><form><label for="task-title">New task</label><div class="entry"><input id="task-title" name="title" maxlength="200" required autocomplete="off"><button>Add task</button></div></form><p class="status" aria-live="polite"></p><div data-region="tasks"></div>';
    },
    ui: { title: '#task-title', status: '.status' },
    events: { 'submit form': 'addTask' },
    collectionEvents: { 'update change:done': 'updateStatus' },
    afterRender: function () {
      this.regions.tasks.show(this.subviews.collectionView);
      this.updateStatus();
    },
    addTask: function (event) {
      event.preventDefault();
      var title = this.ui.title.val().trim();
      if (title) {
        this.collection.add({ title: title });
        this.ui.title.val('').trigger('focus');
      }
    },
    updateStatus: function () {
      var remaining = this.collection.where({ done: false }).length;
      this.ui.status.text(remaining + ' remaining / ' + this.collection.length + ' total');
    }
  });
  var AboutPage = Andamio.ItemView.extend({
    template: function () {
      return '<h1>About this sample</h1><p>This app uses Andamio models, collections, item views, collection views, regions, and routing.</p><p>Tasks stay in memory while you move between pages. A page reload restores the two sample tasks.</p><a href="#">Back to tasks</a>';
    }
  });
  var Layout = Andamio.ItemView.extend({
    template: function () {
      return '<header><a href="#" class="brand">Andamio.js</a><nav aria-label="Main"><a href="#">Tasks</a><a href="#about">About</a></nav></header><section data-region="page"></section><footer>A Backbone.js sample app</footer>';
    }
  });
  var Router = Andamio.Router.extend({ routes: [
    { url: '', name: 'tasks', view: TasksPage },
    { url: 'about', name: 'about', view: AboutPage },
    { url: '*path', redirectTo: '' }
  ] });
  var app = new Andamio.Application();
  app.start({ appView: Layout, router: Router });
}());
