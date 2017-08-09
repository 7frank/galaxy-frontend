import { Ng2testPage } from './app.po';

describe('ng2test App', () => {
  let page: Ng2testPage;

  beforeEach(() => {
    page = new Ng2testPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
