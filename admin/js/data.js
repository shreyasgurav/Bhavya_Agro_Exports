// VF Admin - LocalStorage CRUD + Seed Data
window.VF = {
  // Basic CRUD operations
  getAll(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
  },
  
  getSettings() {
    return JSON.parse(localStorage.getItem('vf_settings')) || {};
  },
  
  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
  
  add(key, item) {
    const items = this.getAll(key);
    const newItem = {
      ...item,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    this.save(key, items);
    return newItem;
  },
  
  update(key, id, changes) {
    const items = this.getAll(key);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...changes, updatedAt: new Date().toISOString() };
      this.save(key, items);
      return items[index];
    }
    return null;
  },
  
  delete(key, id) {
    const items = this.getAll(key);
    const filtered = items.filter(item => item.id !== id);
    this.save(key, filtered);
    return filtered.length !== items.length;
  },
  
  // Activity logging
  log(action) {
    const logs = this.getAll('vf_activity_log');
    logs.unshift({
      action,
      ts: new Date().toLocaleString()
    });
    // Keep only last 50 logs
    if (logs.length > 50) {
      logs.splice(50);
    }
    this.save('vf_activity_log', logs);
  },
  
  // Seed data initialization
  seed() {
    if (localStorage.getItem('vf_seeded')) return;
    
    // Products
    const products = [
      {
        name: 'Thompson Seedless Grapes',
        category: 'Fresh Fruits',
        origin: 'Maharashtra, India',
        tag: 'Bestseller',
        shortDesc: 'Handpicked from sun-drenched vineyards. APEDA certified.',
        longDesc: 'Handpicked from sun-drenched vineyards in Maharashtra. APEDA certified, prized globally for crisp texture, natural sweetness, and extended shelf life. Available in 4kg, 5kg, and 8kg punnet packs.',
        priceLabel: 'On Request / tonne',
        imageUrl: 'https://images.unsplash.com/photo-1474804280523-d0be9834b1ad?w=600',
        exportMarkets: 'Middle East, Europe, Southeast Asia',
        featured: true,
        active: true
      },
      {
        name: 'Bhagwa Pomegranate',
        category: 'Fresh Fruits',
        origin: 'Solapur, Maharashtra',
        tag: 'Seasonal',
        shortDesc: 'Ruby-red arils, deep sweetness, high bruise resistance.',
        longDesc: 'Ruby-red arils with exceptional sweetness and high bruise resistance. Cultivated in the ideal climate of Solapur, Maharashtra. Available during peak season months.',
        priceLabel: 'On Request / tonne',
        imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600',
        exportMarkets: 'Europe, Middle East, USA',
        featured: true,
        active: true
      },
      {
        name: 'Organic Turmeric',
        category: 'Spices & Agri',
        origin: 'Sangli, Maharashtra',
        tag: 'Organic',
        shortDesc: 'Curcumin 5%+, sun-dried, certified organic.',
        longDesc: 'Premium organic turmeric with curcumin content above 5%. Sun-dried using traditional methods to preserve color and medicinal properties. Certified organic by recognized authorities.',
        priceLabel: 'On Request / tonne',
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600',
        exportMarkets: 'USA, Europe, Japan',
        featured: false,
        active: true
      },
      {
        name: 'Red & White Onions',
        category: 'Spices & Agri',
        origin: 'Nashik, Maharashtra',
        tag: '',
        shortDesc: 'Export-grade, exceptional pungency and storage life.',
        longDesc: 'Export-grade red and white onions with exceptional pungency and extended storage life. Carefully selected and processed to meet international quality standards.',
        priceLabel: 'On Request / tonne',
        imageUrl: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600',
        exportMarkets: 'Middle East, Southeast Asia',
        featured: false,
        active: true
      },
      {
        name: 'Barley Flakes',
        category: 'Cereals & Flakes',
        origin: 'Pan India',
        tag: '',
        shortDesc: 'High fiber, premium pearl barley processed into flakes.',
        longDesc: 'High fiber barley flakes made from premium pearl barley. Processed using advanced techniques to retain nutritional value and extend shelf life.',
        priceLabel: 'On Request / tonne',
        imageUrl: 'https://images.unsplash.com/photo-1555951015-6da899b92c90?w=600',
        exportMarkets: 'Europe, USA',
        featured: false,
        active: true
      },
      {
        name: 'Corn Flakes',
        category: 'Cereals & Flakes',
        origin: 'Pan India',
        tag: '',
        shortDesc: 'Premium maize, moisture-free, bulk 20kg HDPE packing.',
        longDesc: 'Premium quality corn flakes made from carefully selected maize. Moisture-free processing ensures extended shelf life. Available in bulk 20kg HDPE packaging.',
        priceLabel: 'On Request / tonne',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
        exportMarkets: 'Middle East, Africa',
        featured: false,
        active: true
      },
      {
        name: 'Millet Flakes',
        category: 'Cereals & Flakes',
        origin: 'Pan India',
        tag: 'Gluten Free',
        shortDesc: '100% natural millets, gluten-free, antioxidant-rich.',
        longDesc: '100% natural millet flakes, completely gluten-free and rich in antioxidants. Perfect for health-conscious markets and specialty food products.',
        priceLabel: 'On Request / tonne',
        imageUrl: 'https://images.unsplash.com/photo-1622480916113-9000ac49b79d?w=600',
        exportMarkets: 'Europe, USA, Southeast Asia',
        featured: false,
        active: true
      },
      {
        name: 'Breakfast Cereals (Multi-Grain)',
        category: 'Cereals & Flakes',
        origin: 'Pan India',
        tag: '',
        shortDesc: 'Multi-grain blend — corn, millet, barley, rice flakes.',
        longDesc: 'Nutritious multi-grain breakfast cereal blend combining corn, millet, barley, and rice flakes. Balanced nutrition and appealing taste for international markets.',
        priceLabel: 'On Request / tonne',
        imageUrl: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=600',
        exportMarkets: 'Middle East, Europe',
        featured: false,
        active: true
      }
    ];
    
    // Categories
    const categories = [
      {
        name: 'Fresh Fruits',
        slug: 'fresh-fruits',
        description: 'Premium fresh fruits including grapes, pomegranates, and seasonal varieties',
        imageUrl: 'https://images.unsplash.com/photo-1474804280523-d0be9834b1ad?w=400',
        order: 1,
        active: true
      },
      {
        name: 'Cereals & Flakes',
        slug: 'cereals-flakes',
        description: 'Processed cereals and nutritious grain flakes for breakfast and health foods',
        imageUrl: 'https://images.unsplash.com/photo-1555951015-6da899b92c90?w=400',
        order: 2,
        active: true
      },
      {
        name: 'Spices & Agri',
        slug: 'spices-agri',
        description: 'Premium spices, onions, turmeric and other agricultural commodities',
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
        order: 3,
        active: true
      }
    ];
    
    // Certificates
    const certificates = [
      {
        name: 'APEDA Registration',
        authority: 'Agricultural & Processed Food Products Export Development Authority',
        description: 'Bhavya Agro Exports is a registered exporter under APEDA, authorising us to export scheduled agricultural and processed food products from India to global markets.',
        badgeText: 'Govt. of India',
        icon: '🏆',
        validUntil: '',
        active: true
      },
      {
        name: 'FSSAI License',
        authority: 'Food Safety and Standards Authority of India',
        description: 'All products are processed, packed, and stored in compliance with FSSAI food safety standards — ensuring hygienic, safe, and traceable supply chains.',
        badgeText: 'Central License',
        icon: '🛡️',
        validUntil: '',
        active: true
      },
      {
        name: 'GST Registration',
        authority: 'Government of India',
        description: 'Fully GST-compliant business entity. All invoices, tax documents, and export filings are maintained in accordance with Indian tax law.',
        badgeText: 'Tax Compliant',
        icon: '📋',
        validUntil: '',
        active: true
      },
      {
        name: 'Phytosanitary Certificate',
        authority: 'Plant Quarantine Authority of India',
        description: 'All fresh produce exports are accompanied by valid Phytosanitary Certificates issued by the Plant Quarantine Authority — mandatory for live plant material export.',
        badgeText: 'Per Shipment',
        icon: '🌿',
        validUntil: '',
        active: true
      },
      {
        name: 'Certificate of Origin',
        authority: 'Export Inspection Council / Chamber of Commerce',
        description: 'Every consignment is accompanied by a Certificate of Origin to facilitate customs clearance and preferential trade terms under bilateral agreements.',
        badgeText: 'Per Consignment',
        icon: '🚢',
        validUntil: '',
        active: true
      },
      {
        name: 'Lab Analysis Reports',
        authority: 'NABL Accredited Laboratories',
        description: 'On-request lab analysis for pesticide residue, heavy metals, microbial count, curcumin content, brix levels, and other quality parameters.',
        badgeText: 'Available',
        icon: '🔬',
        validUntil: '',
        active: true
      }
    ];
    
    // Enquiries
    const enquiries = [
      {
        name: 'Ahmad Al-Rashidi',
        company: 'Dubai Fresh Co.',
        email: 'ahmad@dubaifresh.com',
        phone: '+971 50 123 4567',
        country: 'UAE',
        enquiryType: 'Product Enquiry',
        productInterest: 'Thompson Seedless Grapes',
        message: 'We\'re interested in a trial shipment of 5 tonnes of Thompson Seedless Grapes. Please provide pricing and availability for Q2 2025.',
        status: 'new',
        receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Maria Hoffmann',
        company: 'BioNaturals GmbH',
        email: 'm.hoffmann@bionaturals.de',
        phone: '+49 30 123 45678',
        country: 'Germany',
        enquiryType: 'Technical Query',
        productInterest: 'Organic Turmeric',
        message: 'Requesting lab report showing curcumin percentage and organic certification details for potential bulk order.',
        status: 'replied',
        receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Kevin Osei',
        company: 'AfroFresh Ltd',
        email: 'kevin@afrofresh.com.gh',
        phone: '+233 20 123 4567',
        country: 'Ghana',
        enquiryType: 'Partnership',
        productInterest: 'Multiple Products',
        message: 'Looking for a long-term supply partner for West Africa market. Interested in multiple product categories.',
        status: 'archived',
        receivedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Priya Sharma',
        company: 'FoodBridge Pvt Ltd',
        email: 'priya@foodbridge.sg',
        phone: '+65 6123 4567',
        country: 'Singapore',
        enquiryType: 'Distribution',
        productInterest: 'Millet Flakes',
        message: 'We supply to health food retail chains across SEA. Need consistent quality and certification documentation.',
        status: 'new',
        receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Carlos Mendez',
        company: 'NaturExport SL',
        email: 'carlos@naturexport.es',
        phone: '+34 91 123 4567',
        country: 'Spain',
        enquiryType: 'Product Enquiry',
        productInterest: 'Bhagwa Pomegranate',
        message: 'Interested in seasonal pomegranate supply for EU market. Need pricing for container loads and shipping schedule.',
        status: 'new',
        receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Settings
    const settings = {
      companyName: 'Bhavya Agro Exports',
      tagline: 'Exporting India\'s Best Flavors',
      phone: '+91 91301 11989',
      email: 'namaste.bhavyaagroexports@gmail.com',
      address: 'Degloor, Dist. Nanded, Maharashtra — 431717, India',
      website: 'https://www.bhavyaagroexports.com',
      adminName: 'Omkar Ghadgile',
      username: 'admin',
      password: 'admin123',
      heroTagline: 'India\'s Finest Flavours',
      heroSubtitle: 'Premium agricultural exports from the heartlands of Maharashtra',
      marqueeItems: 'Premium Grapes,Bhagwa Pomegranate,Organic Turmeric,Dehydrated Onions,Millet Flakes,Basmati Rice,Barley Flakes,Corn Flakes',
      footerTagline: 'Exporting India\'s finest agricultural produce to over 50 countries'
    };
    
    // Save all data
    this.save('vf_products', products);
    this.save('vf_categories', categories);
    this.save('vf_certificates', certificates);
    this.save('vf_enquiries', enquiries);
    this.save('vf_settings', settings);
    this.save('vf_activity_log', []);
    
    // Mark as seeded
    localStorage.setItem('vf_seeded', 'true');
    
    // Log seeding
    this.log('Database seeded with initial data');
  }
};
