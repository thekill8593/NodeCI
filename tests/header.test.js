const Page = require("./helpers/page");

let page;

beforeEach(async () => {
	page = await Page.build();	
	await page.goto('http://localhost:3000/');
});

test('we can launch a browser', async () => {
	const text = await page.getContentsOf('a.brand-logo');

	expect(text).toEqual('Blogster');
});

test('clicking login starts a oath flow', async () => {
	await page.click('.right a');
	const url = await page.url();
	expect(url).toMatch(/accounts\.google\.com/);	
});

test('when signed in, show logout button', async () => {

	await page.login();
	
	const text = await page.getContentsOf('a[href="/auth/logout"]');

	expect(text).toEqual('Logout');
});

afterEach(async () => {
	await page.close();
})

