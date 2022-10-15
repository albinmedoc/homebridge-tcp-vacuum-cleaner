import { API, Logging } from 'homebridge';
import { createHomebridgeMock } from '../__mocks__/homebridge';
import { createCleanmateServiceMock } from '../__mocks__/cleanmateService';
import { BatteryService } from '../../src/services';
import Constants from '../constants';
import CleanmateService from '../../src/cleanmateService';
import { WorkState } from '../../src/types';

describe('Battery service', () => {
  let homebridge: jest.Mocked<API>;
  let cleanmateService: jest.Mocked<CleanmateService>;
  let batteryService: BatteryService;
  let updateCharacteristicSpy: jest.SpyInstance;
  const log: Logging = console as unknown as Logging;

  beforeEach(() => {
    homebridge = createHomebridgeMock();
    cleanmateService = createCleanmateServiceMock(
      Constants.IP_ADDRESS,
      Constants.AUTH_CODE,
      0,
    );
    batteryService = new BatteryService(homebridge.hap, log, Constants.FULL_CONFIG, cleanmateService);
    updateCharacteristicSpy = jest.spyOn(batteryService.services[0], 'updateCharacteristic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Has one service', () => {
    expect(batteryService.services).toHaveLength(1);
  });

  test('Update characteristic when battery level changes', () => {
    cleanmateService.events.emit('batteryLevelChange', 50);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.BatteryLevel, 50);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.StatusLowBattery, 0);

    cleanmateService.events.emit('batteryLevelChange', 5);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.BatteryLevel, 5);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.StatusLowBattery, 1);
  });

  test('Update characteristic when workstate changes', () => {
    cleanmateService.events.emit('workStateChange', WorkState.Cleaning);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.ChargingState, 0);

    cleanmateService.events.emit('workStateChange', WorkState.Charging);
    expect(updateCharacteristicSpy).toBeCalledWith(homebridge.hap.Characteristic.ChargingState, 1);
  });

  test('Get battery level state', () => {
    jest.spyOn(cleanmateService, 'batteryLevel', 'get').mockReturnValue(50);
    expect(batteryService['getBatteryLevelState']()).toEqual(50);

    jest.spyOn(cleanmateService, 'batteryLevel', 'get').mockReturnValue(5);
    expect(batteryService['getBatteryLevelState']()).toEqual(5);
  });

  test('Get charging state', () => {
    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Cleaning);
    expect(batteryService['getChargingState']()).toEqual(0);

    jest.spyOn(cleanmateService, 'workState', 'get').mockReturnValue(WorkState.Charging);
    expect(batteryService['getChargingState']()).toEqual(1);
  });
});