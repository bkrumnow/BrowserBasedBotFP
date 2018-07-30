const webdriver = require('selenium-webdriver');
const safari = require("/usr/bin/safaridriver");

let driver = new webdriver.Builder()
    .forBrowser('safari')
    .build();

from selenium import webdriver
driver = webdriver.Safari()
driver.get("http://localhost:8080")
element = driver.find_elements_by_id("txtConfDesc")[0]
element.click()
element.send_keys("Safari_webdriver")
element = driver.find_elements_by_id("btnFP")[0]
element.click()

alert = driver.switch_to.alert
alert.accept()